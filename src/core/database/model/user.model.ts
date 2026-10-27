import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  AuthProviderEnum,
  UserRoleEnum,
} from '../../../common/enum/security.enum.js';
import type { IUser } from '../../../common/interface/database-schema.interface.js';

export type HUserDocument = HydratedDocument<IUser>;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    required: false,
    select: false,
  })
  passwordHash?: string;

  @Prop({
    required: true,
    trim: true,
  })
  city: string;

  @Prop({
    required: true,
    enum: Object.values(UserRoleEnum),
    type: String,
  })
  role: UserRoleEnum;

  @Prop({
    required: true,
    enum: Object.values(AuthProviderEnum),
    type: String,
    default: AuthProviderEnum.SYSTEM,
  })
  provider: AuthProviderEnum;

  @Prop({ type: String, unique: true, sparse: true, select: false })
  googleId?: string;

  @Prop({ type: Date, default: null })
  emailVerifiedAt?: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
