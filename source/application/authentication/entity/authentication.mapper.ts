import type { Types } from 'mongoose';

import type { HUserDocument } from '../../../database/model/index.js';
import type { IUser } from '../../../dependencies/interface/index.js';
import { AuthenticationEntity } from './authentication.entity.js';

export const toAuthenticationEntity = (document: HUserDocument): AuthenticationEntity => {
  const user = document.toObject<IUser & { _id: Types.ObjectId }>();
  return new AuthenticationEntity(
    user._id,
    user.role,
    user.name,
    user.email,
    user.city,
    user.phone,
    user.avatarUrl,
    user.provider,
    user.emailVerifiedAt ?? null,
    user.consentAcceptedAt ?? null,
    user.isActive,
    user.createdAt,
    user.updatedAt,
  );
};
