import { ConflictException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PatientRepository } from '../../database/repository/patient.repository.js';
import { DoctorRepository } from '../../database/repository/doctor.repository.js';
import type { IDoctor, IPatient } from '../interface/database-schema.interface.js';
import { UtilService } from './util.service.js';

export const isDuplicateKeyError = (error: unknown): error is { code: number; keyPattern?: Record<string, unknown> } =>
  typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === 11000;

/** Creates the role-specific profile document that goes with each user. */
@Injectable()
export class ProfileService {
  constructor(
    private readonly patients: PatientRepository,
    private readonly doctors: DoctorRepository,
    private readonly util: UtilService,
  ) {}

  async createPatientProfile(
    userId: Types.ObjectId,
    data: Partial<Omit<IPatient, 'user' | 'medicalRecordNumber'>> = {},
  ) {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await this.patients.create({
          data: { ...data, user: userId, medicalRecordNumber: this.util.createMedicalRecordNumber() },
        });
      } catch (error) {
        if (isDuplicateKeyError(error) && error.keyPattern?.medicalRecordNumber) continue;
        throw error;
      }
    }
    throw new ConflictException('Could not allocate a patient ID, please retry');
  }

  async createDoctorProfile(
    userId: Types.ObjectId,
    data: Pick<IDoctor, 'clinicName' | 'clinicAddress'> & Partial<IDoctor>,
  ) {
    try {
      return await this.doctors.create({ data: { ...data, user: userId } });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException('This license number is already registered');
      }
      throw error;
    }
  }
}
