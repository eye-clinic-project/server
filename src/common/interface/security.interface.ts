import { JwtSignOptions } from '@nestjs/jwt';
import type { JwtPayload } from 'jsonwebtoken';

export interface DecodedToken extends JwtPayload {
  sub?: string;
  aud?: string | string[];
  jti?: string;
  iat?: number;
  exp?: number;
}
export interface JwtType {
  payload: object;
  secret?: string;
  options?: JwtSignOptions;
}
export interface VerifyJwt {
  token: string;
  secret?: string;
}
