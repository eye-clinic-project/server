import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Doctor, HDoctorDocument } from '../model/doctor.model.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class DoctorRepository extends DatabaseRepository<HDoctorDocument> {
  constructor(@InjectModel(Doctor.name) model: Model<HDoctorDocument>) {
    super(model);
  }
}
