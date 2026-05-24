import { Request, Response } from "express";
import { authServices } from "../services";
import { Body, Controller, Injectable, Post, Req, Res } from "@nestjs/common";
interface AccessCodeDoc {
  code: number;
  expiresAt: number;
}

export interface LoginData {
  token: string;
  uid: string;
  email: string | null;
}

@Controller("auth")
@Injectable()
export class authController {
  constructor(private authService: authServices) {}

  // static createAccesscode = async (req: Request, res: Response) => {
  //   const { phoneNumber } = req.body;
  //   try {
  //     if (!phoneNumber) {
  //       return res.status(400).json({ error: "Phone number is required " });
  //     }

  //     let code = authServices.generateVerifycationCode();
  //     await authServices.CreateAccessCode(phoneNumber, code);
  //     return res.status(200).json({
  //       message: "Access code is sent",
  //     });
  //   } catch (error) {
  //     res.status(500).json({ error: "Failed to create access code" });
  //   }
  // };
  // static validateAccessCode = async (req: Request, res: Response) => {
  //   const { phoneNumber, accessCode } = req.body;
  //   if (!phoneNumber || !accessCode) {
  //     return res.status(400).json({
  //       error: "phoneNumber and accessCode are required",
  //     });
  //   }
  //   try {
  //     const phonenumberSaved = db.collection("accessCodes").doc(phoneNumber);
  //     const snapPhoneNumber = await phonenumberSaved.get();
  //     if (!snapPhoneNumber.exists) {
  //       return res.status(401).json({ error: "Invalid or expired code" });
  //     }
  //     const { code, expiresAt } = snapPhoneNumber.data() as AccessCodeDoc;
  //     console.log("snapPhoneNumber", snapPhoneNumber);

  //     if (Date.now() > expiresAt) {
  //       await phonenumberSaved.delete();
  //       return res.status(401).json({ error: "Code expired" });
  //     }

  //     if (Number(code).toString() !== accessCode) {
  //       return res.status(401).json({ error: "Invalid code" });
  //     }
  //     await phonenumberSaved.delete();

  //     const userSnap = await db.collection("users").doc(phoneNumber).get();

  //     const userType: UserType = userSnap.exists
  //       ? ((userSnap.data()?.type as UserType) ?? "student")
  //       : "student";

  //     const token = signAccessToken({
  //       phone: phoneNumber,
  //     });

  //     const refreshoken = signRefreshToken({
  //       phone: phoneNumber,
  //     });

  //     return res.status(200).json({
  //       authenticated: true,
  //       name: userSnap.data()?.name ?? "I",
  //       role: userType,
  //       accessToken: token,
  //       refreshToken: refreshoken,
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     return res.status(500).json({
  //       error: "Failed to validate access code",
  //     });
  //   }
  // };
  @Post("login")
  loginWithUsernameAndPassword(
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.authService.login(body.email, body.password, req, res);

    // const snap = await db
    //   .collection("users")
    //   .where("username", "==", username)
    //   .limit(1)
    //   .get();

    // if (snap.empty) {
    //   return { message: "Invalid credentials" };
    // }

    // const user = snap.docs[0].data();

    // const isMatchPassword = await bcrypt.compare(password, user.passwordHash);

    // if (!isMatchPassword) {
    //   return { message: "Password is wrong" };
    // }

    // const token = signAccessToken({
    //   email: username,
    // });

    // const refreshToken = signRefreshToken({
    //   email: username,
    // });

    // return res.json({
    //   accessToken: token,
    //   refreshToken: refreshToken,
    //   role: user.role,
    //   name: user.name,
    //   authenticated: true,
    // });
  }
  @Post("resgisterUser")
  registerUser(@Req() req: Request, @Res() res: Response) {
    console.log("dsadsad", req);

    return this.authService.registerUser(req, res);
  }
  @Post("setupPassword")
  setupPassword(@Body() body: any, @Res() res: Response) {
    return this.authService.setupPassword(body.token, body.password, res);
  }

  @Post("forgetPassword")
  resetPassword(@Body() body: any, @Res() res: Response) {
    let email = body.email;
    return this.authService.forgetPassword(email, res);
  }
}
