import { Request } from "express";
import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import ms from "ms";
export interface TokenPayload extends JwtPayload {
  phone?: number;
  email?: string;
  id?: string;
}

const toSeconds = (value: string | undefined, fallback: number) =>
  value ? Math.floor(ms(value as ms.StringValue) / 1000) : fallback;

export const signAccessToken = (payload: TokenPayload) =>
  jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET as string, {
    expiresIn: toSeconds(process.env.ACCESS_TOKEN_EXPIRES, 900),
  });

export const signRefreshToken = (payload: TokenPayload) =>
  jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET as string, {
    expiresIn: toSeconds(process.env.REFRESH_TOKEN_EXPIRES, 1000),
  });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as TokenPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string) as TokenPayload;

export const getDecode = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return undefined;
  const token = authHeader.split(" ")[1];

  const decoded = verifyAccessToken(token);
  return decoded;
};
