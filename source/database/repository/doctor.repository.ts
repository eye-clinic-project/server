import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseRepository } from './base.repository.js';
import { Doctor } from '../model/doctor.model.js';
import { IDoctor } from '../../dependency/interface/database-schema.interface.js';

@Injectable()
export class DoctorRepository extends DatabaseRepository<IDoctor> {
  constructor(
    @InjectModel(Doctor.name)
    readonly typedModel: Model<IDoctor>,
  ) {
    super(typedModel);
  }
}
