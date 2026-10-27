import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { DatabaseRepository } from './base.repository.js';
import { Doctor } from '../model/doctor.model.js';
import { IDoctor } from '../../../common/interface/database-schema.interface.js';

@Injectable()
export class DoctorRepository extends DatabaseRepository<IDoctor> {
  constructor(
    @InjectModel(Doctor.name)
    private readonly doctorProfileModel: Model<IDoctor>,
  ) {
    super(doctorProfileModel);
  }

  async findByUserId(userId: Types.ObjectId) {
    return this.doctorProfileModel
      .findOne({ user: userId })
      .populate('user')
      .exec();
  }

  async findBySpecialty(specialty: string) {
    return this.doctorProfileModel
      .find({ specialty: { $regex: specialty, $options: 'i' } })
      .populate('user')
      .exec();
  }

  async findByClinicName(clinicName: string) {
    return this.doctorProfileModel
      .find({ clinicName: { $regex: clinicName, $options: 'i' } })
      .populate('user')
      .exec();
  }

  async findByLicenseNumber(licenseNumber: string) {
    return this.doctorProfileModel
      .findOne({ licenseNumber })
      .exec();
  }

  async licenseExists(licenseNumber: string) {
    return this.doctorProfileModel.exists({ licenseNumber });
  }
}