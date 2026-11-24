import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { IRefreshTokenRevocation } from '../../dependencies/interface/database.interface.js';
import { RefreshTokenRevocation } from '../model/refresh-token.model.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class RefreshTokenRevocationRepository extends DatabaseRepository<IRefreshTokenRevocation> {
  constructor(@InjectModel(RefreshTokenRevocation.name) private readonly refreshTokenRevocationModel: Model<IRefreshTokenRevocation>) {
    super(refreshTokenRevocationModel);
  }
}
