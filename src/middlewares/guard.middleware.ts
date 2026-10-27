import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || "bao-it-key";

export interface TokenPayload {
  sub: number | string;
  email?: string;
  [key: string]: any;
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers?.authorization;
  if (!authHeader) return null;
  return authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as unknown as TokenPayload;
}

// Dual guard and middleware: works with @UseGuards(GuardMiddleware) and consumer.apply(GuardMiddleware).
@Injectable()
export class GuardMiddleware implements CanActivate, NestMiddleware {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    return this.validate(req);
  }

  use(req: Request, _res: Response, next: NextFunction): void {
    this.validate(req);
    next();
  }

  private validate(req: Request): boolean {
    const token = extractToken(req);
    if (!token) {
      throw new UnauthorizedException("No token provided");
    }
    try {
      const decoded = verifyToken(token);
      (req as any).user = decoded;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }
  }
}

export const AuthGuard = GuardMiddleware;

// Express-style middleware function for direct router or app.use usage.
export const guardMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    const decoded = verifyToken(token);
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
};

