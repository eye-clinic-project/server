import type { Types } from 'mongoose';

import { AuthProviderEnum, SystemRoleEnum } from '../../../dependencies/enum/security.enum.js';
import type { IUser } from '../../../dependencies/interface/database.interface.js';
import type { HUserDocument } from '../../../database/model/user.model.js';
import type { UserProfile } from '../type/user.type.js';

export class UserEntity implements UserProfile {
  constructor(
    public readonly _id: Types.ObjectId,
    public readonly role: SystemRoleEnum,
    public readonly name: string,
    public readonly email: string,
    public readonly city: string,
    public readonly emailVerified: boolean,
    public readonly phone?: string,
    public readonly avatarUrl: string | null = null,
    public readonly provider?: AuthProviderEnum,
    public readonly language: string | null = null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}

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
