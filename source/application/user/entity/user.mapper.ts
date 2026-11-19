import type { Types } from 'mongoose';

import type { HUserDocument } from '../../../database/model/index.js';
import type { IUser } from '../../../dependencies/interface/index.js';
import { UserEntity } from './user.entity.js';

export const toUserEntity = (document: HUserDocument): UserEntity => {
  const user = document.toObject<IUser & { _id: Types.ObjectId }>();
  return new UserEntity(
    user._id,
    user.role,
    user.name,
    user.email,
    user.city,
    !!user.emailVerifiedAt,
    user.phone,
    user.avatarUrl ?? null,
    user.provider,
    user.language ?? null,
    user.createdAt,
    user.updatedAt,
  );
};
