import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../../shared/Database/prisma.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { Request, Response } from "express";

import * as Crypto from "crypto";
import { sendSetupPasswordEmail } from "./email.service";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { TokenExpiredError } from "jsonwebtoken";

const googleOAuthClient = new OAuth2Client();

@Injectable()
export class authServices {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}
  static generateVerifycationCode = () => {
    return Math.floor(100000 + Math.random() * 900000);
  };

  async login(email: string, password: string, req: Request, res: Response) {
    const user = await this.prisma.user.findFirst({ where: { email } });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }
    if (!user.isActive)
      throw new Error("User is not active. Please set up your password.");
    const match = await bcrypt.compare(password, user.password ?? "");
    if (match === false) {
      return res.status(400).json({
        message: "Wrong password",
      });
    }

    return this.createLoginSession(user, req, res);
  }

  async loginWithGoogle(idToken: string, req: Request, res: Response) {
    if (!idToken) {
      return res.status(400).json({ message: "Google ID token is required" });
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      return res
        .status(500)
        .json({ message: "Google OAuth is not configured" });
    }

    let googleAccount: TokenPayload | undefined;

    try {
      const ticket = await googleOAuthClient.verifyIdToken({
        idToken,
        audience: googleClientId,
      });
      googleAccount = ticket.getPayload();
    } catch {
      return res.status(401).json({ message: "Invalid Google ID token" });
    }

    if (
      !googleAccount?.sub ||
      !googleAccount.email ||
      !googleAccount.email_verified
    ) {
      return res
        .status(401)
        .json({ message: "Google account email is not verified" });
    }

    const email = googleAccount.email.trim().toLowerCase();
    let user = await this.prisma.user.findUnique({
      where: { ssoId: googleAccount.sub },
    });

    if (!user) {
      user = await this.prisma.user.findFirst({ where: { email } });

      if (user?.ssoId && user.ssoId !== googleAccount.sub) {
        return res.status(409).json({
          message: "This email is already linked to another Google account",
        });
      }

      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            ssoId: googleAccount.sub,
            isActive: true,
          },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            name: googleAccount.name?.trim() || email.split("@")[0],
            email,
            ssoId: googleAccount.sub,
            isActive: true,
          },
        });
      }
    } else if (!user.isActive) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { isActive: true },
      });
    }

    return this.createLoginSession(user, req, res);
  }

  private async createLoginSession(
    user: { id: number; email: string },
    req: Request,
    res: Response,
  ) {
    const tokens = this.generateTokens(user);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
        expiredAt: new Date(Date.now() + 7 * 86400000),
      },
    });

    return res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  }

  generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwt.sign(payload, {
      expiresIn: "15m",
    });

    const refreshToken = this.jwt.sign(payload, {
      expiresIn: "7d",
    });

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    const session = await this.prisma.session.findFirst({
      where: { refreshToken },
    });

    if (!session) throw new Error("Invalid token");

    const payload = this.jwt.verify(refreshToken);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    return this.generateTokens(user);
  }

  async checkAccessToken(accessToken: string, refreshToken: string) {
    if (!accessToken || !refreshToken) {
      throw new BadRequestException(
        "Access token and refresh token are required",
      );
    }

    let accessTokenPayload: { sub: number; email: string };

    try {
      accessTokenPayload = this.jwt.verify(accessToken);
    } catch (error) {
      if (!(error instanceof TokenExpiredError)) {
        throw new UnauthorizedException("Invalid access token");
      }

      const session = await this.getValidRefreshSession(refreshToken);
      const expiredAccessTokenPayload = this.jwt.verify<{
        sub: number;
        email: string;
      }>(accessToken, { ignoreExpiration: true });

      if (session.userId !== expiredAccessTokenPayload.sub) {
        throw new UnauthorizedException(
          "Access token and refresh token do not belong to the same account",
        );
      }

      const user = await this.prisma.user.findUnique({
        where: { id: session.userId },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException("Account is not active");
      }

      const tokens = this.generateTokens(user);

      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          refreshToken: tokens.refreshToken,
          expiredAt: new Date(Date.now() + 7 * 86400000),
        },
      });

      return tokens;
    }

    const session = await this.getValidRefreshSession(refreshToken);

    if (session.userId !== accessTokenPayload.sub) {
      throw new UnauthorizedException(
        "Access token and refresh token do not belong to the same account",
      );
    }

    return { accessToken, refreshToken };
  }

  private async getValidRefreshSession(refreshToken: string) {
    const session = await this.prisma.session.findFirst({
      where: { refreshToken },
    });

    if (!session || session.expiredAt <= new Date()) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    let refreshTokenPayload: { sub: number };

    try {
      refreshTokenPayload = this.jwt.verify(refreshToken);
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    if (refreshTokenPayload.sub !== session.userId) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    return session;
  }

  async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException("Refresh token is required");
    }

    await this.prisma.session.deleteMany({
      where: { refreshToken },
    });

    return { message: "Logged out successfully" };
  }

  async registerUser(req: Request, res: Response) {
    const { fullName, email, phone } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }
    let userExist = await this.prisma.user.findFirst({
      where: { email },
    });

    if (userExist) {
      throw new NotFoundException("User already exists"); // 404
    }

    const token = Crypto.randomBytes(16).toString("hex");
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    await this.prisma.user.create({
      data: {
        name: fullName,
        email,
        verificationToken: token,
        setupTokenExpires: expiresAt,
        isActive: false,
      },
    });
    sendSetupPasswordEmail(email, token);

    return res.status(200).json({
      message:
        "User registered successfully. Please check your email to set up your password.",
    });
  }

  async setupPassword(token: string, password: string, Res: Response) {
    const user = await this.prisma.user.findFirst({
      where: { verificationToken: token },
    });
    if (!user) {
      throw new Error("Invalid token");
    }

    if (user.setupTokenExpires && user.setupTokenExpires < Date.now()) {
      console.log(" Date.now()", Date.now());

      throw new Error("Token expired");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        isActive: true,
        verificationToken: null,
        setupTokenExpires: null,
      },
    });
    return Res.status(200).json({
      message: "Password set up successfully. You can now log in.",
    });
  }

  async forgetPassword(email: string, res: Response) {
    const user = await this.prisma.user.findFirst({
      where: { email: email },
    });
    if (!user) {
      throw new Error("Invalid user");
    }

    let resetPassword = process.env.PASSWORDRESET;
    let passWordHash = await bcrypt.hash(resetPassword?.toString()!, 10);

    const token = Crypto.randomBytes(16).toString("hex");
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: passWordHash,
          verificationToken: token,
          setupTokenExpires: expiresAt,
        },
      });

      sendSetupPasswordEmail(email, token);
      return res.status(200).json({
        message: "Please check your email to set up your password.",
      });
    } catch (error) {
      return error;
    }
  }
  async getCurrentUserLogin(accesstoken: string, Res: Response) {
    const userData = this.jwt.verify(accesstoken);
    const user = await this.prisma.user.findFirst({
      where: { id: userData.sub },
    });
    if (user) {
      return Res.status(200).json({
        ...user,
      });
    }
    return Res.status(404).json({
      message: "User not found",
    });
  }
}
