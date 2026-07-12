import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

type TokenPayload = string | object | Buffer;

const signOptions: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRY as SignOptions['expiresIn'] };

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, signOptions);
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRY as SignOptions['expiresIn'] });
}

export function verifyAccessToken(token: string): unknown {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token: string): unknown {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}
