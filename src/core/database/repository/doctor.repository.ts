import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Doctor, DoctorDocument } from '../model/doctor.model.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class DoctorRepository extends DatabaseRepository<DoctorDocument> {
  constructor(@InjectModel(Doctor.name) model: Model<DoctorDocument>) {
    super(model);
  }
}
