import type { Types } from 'mongoose';

import type { DoctorVerificationStatus } from '../../../dependencies/enum/index.js';
import type { LicenseDocumentEntity } from '../../doctor/entity/index.js';

export class AdminDoctorEntity {
  constructor(
    public readonly _id: Types.ObjectId,
    public readonly userId: Types.ObjectId,
    public readonly name: string,
    public readonly email: string,
    public readonly city: string,
    public readonly phone: string | null,
    public readonly avatarUrl: string | null,
    public readonly isActive: boolean,
    public readonly emailVerified: boolean,
    public readonly clinicName: string,
    public readonly clinicAddress: string,
    public readonly specialty: string | null,
    public readonly licenseNumber: string | null,
    public readonly yearsOfExperience: number | null,
    public readonly status: DoctorVerificationStatus | null,
    public readonly submittedAt: Date | null,
    public readonly verifiedAt: Date | null,
    public readonly verifiedBy: Types.ObjectId | null,
    public readonly rejectionReason: string | null,
    public readonly documents: LicenseDocumentEntity[],
    public readonly createdAt?: Date,
  ) {}
}
