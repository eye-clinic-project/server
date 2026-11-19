import type { Types } from 'mongoose';

import type { DoctorVerificationStatus } from '../../../dependencies/enum/index.js';

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
