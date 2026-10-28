import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { DatabaseRepository } from './base.repository.js';
import { IPatient } from '../../../common/interface/database-schema.interface.js';
import { Patient } from '../model/patient.model.js';

@Injectable()
export class PatientRepository extends DatabaseRepository<IPatient> {
  constructor(
    @InjectModel(Patient.name)
    private readonly patientProfileModel: Model<IPatient>,
  ) {
    super(patientProfileModel);
  }

  async findByUserId(userId: Types.ObjectId) {
    return this.patientProfileModel
      .findOne({ user: userId })
      .populate('user')
      .exec();
  }

  async findByGender(gender: 'male' | 'female') {
    return this.patientProfileModel.find({ gender }).populate('user').exec();
  }

  async findByUserIds(userIds: Types.ObjectId[]) {
    return this.patientProfileModel
      .find({ user: { $in: userIds } })
      .populate('user')
      .exec();
  }
}
