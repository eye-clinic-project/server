import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { IDoctorPatient } from '../../dependencies/interface/index.js';
import { DoctorPatient } from '../model/index.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class DoctorPatientRepository extends DatabaseRepository<IDoctorPatient> {
  constructor(@InjectModel(DoctorPatient.name) private readonly doctorPatientModel: Model<IDoctorPatient>) {
    super(doctorPatientModel);
  }
}
