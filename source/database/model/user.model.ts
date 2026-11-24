import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { AuthProviderEnum, SystemRoleEnum } from '../../dependencies/enum/security.enum.js';
import { DoctorVerificationStatus } from '../../dependencies/enum/database.enum.js';
import { IUser } from '../../dependencies/interface/database.interface.js';

export type HUserDocument = HydratedDocument<IUser>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: false, select: false })
  passwordHash?: string;

  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ type: String, trim: true })
  phone?: string;

  @Prop({ type: String, trim: true })
  avatarUrl?: string;

  @Prop({ required: true, enum: SystemRoleEnum, type: String, index: true })
  role: SystemRoleEnum;

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

  @Prop({ type: Date, default: null })
  consentAcceptedAt?: Date | null;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String, enum: ['en', 'ar', null], default: null })
  language?: string | null;

  @Prop({ type: String, enum: [...Object.values(DoctorVerificationStatus), null], default: null })
  doctorStatus?: DoctorVerificationStatus | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ name: 'text', email: 'text' }, { language_override: 'textSearchLanguage' });
