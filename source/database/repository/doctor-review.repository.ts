import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseRepository } from './base.repository.js';
import { DoctorReview } from '../model/doctor-review.model.js';
import { IDoctorReview } from '../../dependency/interface/database-schema.interface.js';

@Injectable()
export class DoctorReviewRepository extends DatabaseRepository<IDoctorReview> {
  constructor(
    @InjectModel(DoctorReview.name)
    readonly typedModel: Model<IDoctorReview>,
  ) {
    super(typedModel);
  }
}
