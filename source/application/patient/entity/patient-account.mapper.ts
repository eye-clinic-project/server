import { Types } from 'mongoose';

import { HUserDocument } from '../../../database/model/index.js';
import { PatientAccountEntity } from './patient-account.entity.js';

export const toPatientAccountEntity = (user: PatientUserView): PatientAccountEntity =>
  new PatientAccountEntity(user._id, user.name, user.email, user.city, !!user.emailVerifiedAt, user.isActive !== false, user.phone, user.avatarUrl ?? null);

export type PatientUserView = Pick<HUserDocument, 'name' | 'email' | 'city' | 'phone' | 'avatarUrl' | 'emailVerifiedAt' | 'isActive'> & { _id: Types.ObjectId };
