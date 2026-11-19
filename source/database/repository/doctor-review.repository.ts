import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { IDoctorReview } from '../../dependencies/interface/index.js';
import { DoctorReview } from '../model/index.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class DoctorReviewRepository extends DatabaseRepository<IDoctorReview> {
  constructor(@InjectModel(DoctorReview.name) private readonly doctorReviewModel: Model<IDoctorReview>) {
    super(doctorReviewModel);
  }
}
