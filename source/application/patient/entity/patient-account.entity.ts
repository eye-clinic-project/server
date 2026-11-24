import { Types } from 'mongoose';
import { HUserDocument } from '../../../database/model/user.model.js';

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

export const toPatientAccountEntity = (user: PatientUserView): PatientAccountEntity =>
  new PatientAccountEntity(user._id, user.name, user.email, user.city, !!user.emailVerifiedAt, user.isActive !== false, user.phone, user.avatarUrl ?? null);
export type PatientUserView = Pick<HUserDocument, 'name' | 'email' | 'city' | 'phone' | 'avatarUrl' | 'emailVerifiedAt' | 'isActive'> & { _id: Types.ObjectId };
