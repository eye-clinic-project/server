import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseRepository } from './base.repository.js';
import { Patient } from '../model/patient.model.js';
import { IPatient } from '../../dependency/interface/database-schema.interface.js';

@Injectable()
export class PatientRepository extends DatabaseRepository<IPatient> {
  constructor(
    @InjectModel(Patient.name)
    readonly typedModel: Model<IPatient>,
  ) {
    super(typedModel);
  }
}
