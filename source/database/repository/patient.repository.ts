import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { IPatient } from '../../dependencies/interface/index.js';
import { Patient } from '../model/index.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class PatientRepository extends DatabaseRepository<IPatient> {
  constructor(@InjectModel(Patient.name) private readonly patientModel: Model<IPatient>) {
    super(patientModel);
  }
}
