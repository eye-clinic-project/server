import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { IDoctorReview } from '../../dependencies/interface/database.interface.js';
import { DoctorReview } from '../model/doctor-review.model.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class DoctorReviewRepository extends DatabaseRepository<IDoctorReview> {
  constructor(@InjectModel(DoctorReview.name) private readonly doctorReviewModel: Model<IDoctorReview>) {
    super(doctorReviewModel);
  }
}
