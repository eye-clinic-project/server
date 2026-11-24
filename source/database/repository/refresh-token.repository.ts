import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { IRefreshToken } from '../../dependencies/interface/database.interface.js';
import { RefreshToken } from '../model/refresh-token.model.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class RefreshTokenRepository extends DatabaseRepository<IRefreshToken> {
  constructor(@InjectModel(RefreshToken.name) private readonly refreshTokenModel: Model<IRefreshToken>) {
    super(refreshTokenModel);
  }
}
