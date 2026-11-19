import type { Types } from 'mongoose';

import type { GenderEnum } from '../../../dependencies/enum/index.js';
import { PatientAccountEntity } from './patient-account.entity.js';

export class PatientEntity {
  constructor(
    public readonly _id: Types.ObjectId,
    public readonly medicalRecordNumber: string,
    public readonly user: PatientAccountEntity,
    public readonly dateOfBirth: Date | null = null,
    public readonly gender: GenderEnum | null = null,
    public readonly emergencyContact: string | null = null,
    public readonly diabetesSince: number | null = null,
    public readonly medicalNotes: string | null = null,
    public readonly createdBy: Types.ObjectId | null = null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
