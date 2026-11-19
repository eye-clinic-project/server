import type { Types } from 'mongoose';

export class PatientAccountEntity {
  constructor(
    public readonly _id: Types.ObjectId,
    public readonly name: string,
    public readonly email: string,
    public readonly city: string,
    public readonly emailVerified: boolean,
    public readonly isActive: boolean,
    public readonly phone?: string,
    public readonly avatarUrl: string | null = null,
  ) {}
}
