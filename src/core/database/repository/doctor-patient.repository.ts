import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';


import { DatabaseRepository } from './base.repository.js';
import { IDoctorPatient } from '../../../common/interface/database-schema.interface.js';
import { DoctorPatient } from '../model/doctor-patient.model.js';

@Injectable()
export class DoctorPatientRepository extends DatabaseRepository<IDoctorPatient> {
  constructor(
    @InjectModel(DoctorPatient.name)
    private readonly doctorPatientModel: Model<IDoctorPatient>,
  ) {
    super(doctorPatientModel);
  }

  async findByDoctorAndPatient(
    doctorId: Types.ObjectId,
    patientId: Types.ObjectId,
  ) {
    return this.doctorPatientModel
      .findOne({ doctor: doctorId, patient: patientId })
      .exec();
  }

  async isAssigned(
    doctorId: Types.ObjectId,
    patientId: Types.ObjectId,
  ) {
    return this.doctorPatientModel.exists({
      doctor: doctorId,
      patient: patientId,
    });
  }

  async findPatientsByDoctor(doctorId: Types.ObjectId) {
    return this.doctorPatientModel
      .find({ doctor: doctorId })
      .populate('patient')
      .sort({ assignedAt: -1 })
      .exec();
  }

  async findDoctorsByPatient(patientId: Types.ObjectId) {
    return this.doctorPatientModel
      .find({ patient: patientId })
      .populate('doctor')
      .sort({ assignedAt: -1 })
      .exec();
  }

  async removeAssignment(
    doctorId: Types.ObjectId,
    patientId: Types.ObjectId,
  ) {
    return this.doctorPatientModel
      .findOneAndDelete({
        doctor: doctorId,
        patient: patientId,
      })
      .exec();
  }

  async countPatientsByDoctor(doctorId: Types.ObjectId) {
    return this.doctorPatientModel.countDocuments({
      doctor: doctorId,
    });
  }
}