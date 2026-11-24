import { AuthProviderEnum, SystemRoleEnum } from '../../../dependencies/enum/security.enum.js';
import type { Types } from 'mongoose';
import type { IUser } from '../../../dependencies/interface/database.interface.js';
import type { HUserDocument } from '../../../database/model/user.model.js';

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
