import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseRepository } from './base.repository.js';
import { FundusImage } from '../model/fundus-image.model.js';
import { IFundusImage } from '../../dependency/interface/database-schema.interface.js';

@Injectable()
export class FundusImageRepository extends DatabaseRepository<IFundusImage> {
  constructor(
    @InjectModel(FundusImage.name)
    readonly typedModel: Model<IFundusImage>,
  ) {
    super(typedModel);
  }
}
