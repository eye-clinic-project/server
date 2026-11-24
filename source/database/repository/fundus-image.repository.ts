import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { IFundusImage } from '../../dependencies/interface/database.interface.js';
import { FundusImage } from '../model/fundus-image.model.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class FundusImageRepository extends DatabaseRepository<IFundusImage> {
  constructor(@InjectModel(FundusImage.name) private readonly fundusImageModel: Model<IFundusImage>) {
    super(fundusImageModel);
  }
}
