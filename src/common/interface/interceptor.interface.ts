import type { Request } from 'express';
import type { JwtPayload } from 'jsonwebtoken';
import { UserDocument } from '../../core/database/model/user.model.js';

export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface AuthReq extends Request {
  credentials: { user: UserDocument; decoded: JwtPayload };
}

export interface LanguageRequest {
  headers: Record<string, string | string[] | undefined>;
  credentials?: {
    user?: {
      lang?: string;
    };
  };
}
