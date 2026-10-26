import type { JwtPayload } from 'jsonwebtoken';

export interface DecodedToken extends JwtPayload {
  sub?: string;
  aud?: string | string[];
  jti?: string;
  iat?: number;
  exp?: number;
}