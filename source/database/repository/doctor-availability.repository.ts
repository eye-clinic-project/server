import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseRepository } from './base.repository.js';
import { DoctorAvailability } from '../model/doctor-availability.model.js';
import { IDoctorAvailability } from '../../dependency/interface/database-schema.interface.js';

@Injectable()
export class DoctorAvailabilityRepository extends DatabaseRepository<IDoctorAvailability> {
  constructor(
    @InjectModel(DoctorAvailability.name)
    readonly typedModel: Model<IDoctorAvailability>,
  ) {
    super(typedModel);
  }
}
