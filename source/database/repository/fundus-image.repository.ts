import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { IFundusImage } from '../../dependencies/interface/index.js';
import { FundusImage } from '../model/index.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class FundusImageRepository extends DatabaseRepository<IFundusImage> {
  constructor(@InjectModel(FundusImage.name) private readonly fundusImageModel: Model<IFundusImage>) {
    super(fundusImageModel);
  }
}
