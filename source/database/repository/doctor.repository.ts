import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { IDoctor } from '../../dependencies/interface/database.interface.js';
import { Doctor } from '../model/doctor.model.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class DoctorRepository extends DatabaseRepository<IDoctor> {
  constructor(@InjectModel(Doctor.name) private readonly doctorModel: Model<IDoctor>) {
    super(doctorModel);
  }
}
