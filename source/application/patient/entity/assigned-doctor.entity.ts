import type { Types } from 'mongoose';

import type { DoctorVerificationStatus } from '../../../dependencies/enum/index.js';

export class AssignedDoctorEntity {
  constructor(
    public readonly assignmentId: Types.ObjectId,
    public readonly assignedAt: Date | null,
    public readonly _id: Types.ObjectId,
    public readonly name: string,
    public readonly email: string,
    public readonly city: string,
    public readonly phone: string | null = null,
    public readonly avatarUrl: string | null = null,
    public readonly clinicName: string | null = null,
    public readonly clinicAddress: string | null = null,
    public readonly specialty: string | null = null,
    public readonly bio: string | null = null,
    public readonly yearsOfExperience: number | null = null,
    public readonly verificationStatus: DoctorVerificationStatus | null = null,
  ) {}
}
