import type { Types } from 'mongoose';

import { AuthProviderEnum, SystemRoleEnum } from '../../../dependencies/enum/index.js';
import type { IUser } from '../../../dependencies/interface/index.js';

export type UserProfile = Pick<IUser, 'role' | 'name' | 'email' | 'city' | 'phone' | 'provider' | 'createdAt' | 'updatedAt'>;

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
