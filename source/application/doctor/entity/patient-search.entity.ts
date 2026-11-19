import type { Types } from 'mongoose';

export class PatientSearchEntity {
  constructor(
    public readonly _id: Types.ObjectId,
    public readonly medicalRecordNumber: string,
    public readonly name: string,
    public readonly email: string,
    public readonly city: string,
    public readonly avatarUrl: string | null,
    public readonly assigned: boolean,
  ) {}
}
