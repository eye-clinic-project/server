import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { IDoctorAvailability } from '../../dependencies/interface/index.js';
import { DoctorAvailability } from '../model/index.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class DoctorAvailabilityRepository extends DatabaseRepository<IDoctorAvailability> {
  constructor(@InjectModel(DoctorAvailability.name) private readonly doctorAvailabilityModel: Model<IDoctorAvailability>) {
    super(doctorAvailabilityModel);
  }
}
