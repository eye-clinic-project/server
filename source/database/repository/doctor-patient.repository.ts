import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { IDoctorPatient } from '../../dependencies/interface/database.interface.js';
import { DoctorPatient } from '../model/doctor-patient.model.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class DoctorPatientRepository extends DatabaseRepository<IDoctorPatient> {
  constructor(@InjectModel(DoctorPatient.name) private readonly doctorPatientModel: Model<IDoctorPatient>) {
    super(doctorPatientModel);
  }
}
