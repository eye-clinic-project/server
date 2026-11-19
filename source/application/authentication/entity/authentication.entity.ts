import { AuthProviderEnum, SystemRoleEnum } from '../../../dependencies/enum/index.js';
import type { Types } from 'mongoose';
import type { IUser } from '../../../dependencies/interface/index.js';

export type AuthenticationUser = Omit<IUser, 'passwordHash' | 'googleId' | 'language'>;

export class AuthenticationEntity implements AuthenticationUser {
  constructor(
    public readonly _id: Types.ObjectId,
    public readonly role: SystemRoleEnum,
    public readonly name: string,
    public readonly email: string,
    public readonly city: string,
    public readonly phone?: string,
    public readonly avatarUrl?: string,
    public readonly provider?: AuthProviderEnum,
    public readonly emailVerifiedAt: Date | null = null,
    public readonly consentAcceptedAt: Date | null = null,
    public readonly isActive?: boolean,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
