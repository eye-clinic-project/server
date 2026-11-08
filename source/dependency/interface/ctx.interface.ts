import { JwtPayload } from 'jsonwebtoken';
import { Socket } from 'socket.io';

import { Request } from 'express';
import { HUserDocument } from '../../database/model/user.model.js';

export interface IAuthReq extends Request {
  credentials: { user: HUserDocument; decoded: JwtPayload };
}

export interface IAuthSocket extends Socket {
  credentials: { user: HUserDocument; decoded: JwtPayload };
}

export type CtxType = 'http' | 'ws' | 'graphql';
