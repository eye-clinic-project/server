import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DatabaseRepository } from './base.repository.js';
import { DoctorPatient } from '../model/doctor-patient.model.js';
import { IDoctorPatient } from '../../dependency/interface/database-schema.interface.js';
import { AssignmentStatus } from '../../dependency/enum/database.enum.js';

@Injectable()
export class DoctorPatientRepository extends DatabaseRepository<IDoctorPatient> {
  constructor(
    @InjectModel(DoctorPatient.name)
    readonly typedModel: Model<IDoctorPatient>,
  ) {
    super(typedModel);
  }

  /** Active assignment between a doctor and a patient (the basis of doctor access control). */
  isActiveAssignment(doctorId: Types.ObjectId, patientId: Types.ObjectId) {
    return this.typedModel.exists({ doctor: doctorId, patient: patientId, status: AssignmentStatus.ACTIVE }).exec();
  }

  async activePatientIds(doctorId: Types.ObjectId): Promise<Types.ObjectId[]> {
    const rows = await this.typedModel.find({ doctor: doctorId, status: AssignmentStatus.ACTIVE }, { patient: 1 }).lean().exec();
    return rows.map((row) => row.patient);
  }

  async activeDoctorIds(patientId: Types.ObjectId): Promise<Types.ObjectId[]> {
    const rows = await this.typedModel.find({ patient: patientId, status: AssignmentStatus.ACTIVE }, { doctor: 1 }).lean().exec();
    return rows.map((row) => row.doctor);
  }
}
