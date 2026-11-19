import type { Types } from 'mongoose';

import type { IDoctor, IUser } from '../../../dependencies/interface/index.js';
import { PatientEntity } from './patient.entity.js';

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
