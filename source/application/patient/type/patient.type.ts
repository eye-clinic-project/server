import { randomBytes } from 'node:crypto';
import type { Types } from 'mongoose';

import type { IDoctor, IUser } from '../../../dependencies/interface/database.interface.js';
import { PatientEntity } from '../entity/patient.entity.js';
import type { HPatientDocument } from '../../../database/model/patient.model.js';

export const PATIENT_USER_FIELDS = 'name email city phone avatarUrl emailVerifiedAt isActive';

export const ASSIGNED_DOCTOR_USER_FIELDS = 'name email city phone avatarUrl isActive';

export type AssignedDoctorView = {
  _id: Types.ObjectId;
  assignedAt?: Date;
  doctor: Pick<IUser, 'name' | 'email' | 'city' | 'phone' | 'avatarUrl' | 'isActive'> & { _id: Types.ObjectId };
  profile: Pick<IDoctor, 'clinicName' | 'clinicAddress' | 'specialty' | 'bio' | 'yearsOfExperience' | 'verificationStatus'> | null;
};

export interface PatientListEntity {
  docs: PatientEntity[];
  count: number;
  currentPage: number;
  size: number;
  pages: number;
}

export type PatientProfileData = Partial<Pick<HPatientDocument, 'dateOfBirth' | 'gender' | 'emergencyContact' | 'diabetesSince' | 'medicalNotes'>>;

export const generateMedicalRecordNumber = (): string => {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `RC-${date}-${randomBytes(3).toString('hex').toUpperCase()}`;
};
