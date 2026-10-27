import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Patient, PatientDocument } from '../model/patient.model.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class PatientRepository extends DatabaseRepository<PatientDocument> {
  constructor(@InjectModel(Patient.name) model: Model<PatientDocument>) {
    super(model);
  }

  search(term: string, page = 1, size = 10) {
    return this.paginate({
      filter: { $text: { $search: term } },
      page,
      size,
    });
  }
}
