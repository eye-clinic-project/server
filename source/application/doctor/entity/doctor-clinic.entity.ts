import type { Types } from 'mongoose';

import type { DoctorVerificationStatus } from '../../../dependencies/enum/database.enum.js';
import type { DoctorClinicView } from '../type/doctor.type.js';

export class DoctorClinicEntity {
  constructor(
    public readonly _id: Types.ObjectId,
    public readonly user: Types.ObjectId,
    public readonly clinicName: string,
    public readonly clinicAddress: string,
    public readonly specialty: string | null = null,
    public readonly licenseNumber: string | null = null,
    public readonly bio: string | null = null,
    public readonly yearsOfExperience: number | null = null,
    public readonly verificationStatus: DoctorVerificationStatus | null = null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}

export const toDoctorClinicEntity = (doctor: DoctorClinicView): DoctorClinicEntity =>
  new DoctorClinicEntity(
    doctor._id,
    doctor.user,
    doctor.clinicName,
    doctor.clinicAddress,
    doctor.specialty ?? null,
    doctor.licenseNumber ?? null,
    doctor.bio ?? null,
    doctor.yearsOfExperience ?? null,
    doctor.verificationStatus ?? null,
    doctor.createdAt,
    doctor.updatedAt,
  );
