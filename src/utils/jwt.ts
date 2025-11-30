import { sign, verify } from 'jsonwebtoken';
import { config } from '@/config/env';

export interface TokenPayload {
  userId: string;
  email: string;
}

export const generateTokens = (payload: TokenPayload) => {
  const accessToken = sign(payload, config.jwt.secret, {
    expiresIn: "7d",
  });

  const refreshToken = sign(payload, config.jwt.refreshSecret, {
    expiresIn: "30d",
  });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return verify(token, config.jwt.secret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return verify(token, config.jwt.refreshSecret) as TokenPayload;
};