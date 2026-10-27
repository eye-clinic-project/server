import type { Request } from 'express';
import type { JwtPayload } from 'jsonwebtoken';
import type { HUserDocument } from '../../core/database/model/user.model.js';

export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface LanguageRequest {
  headers: Record<string, string | string[] | undefined>;
  credentials?: {
    user?: {
      lang?: string;
    };
  };
}
