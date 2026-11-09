import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IUser } from '../../dependency/interface/database-schema.interface.js';
import {
  AuthProviderEnum,
  SystemRoleEnum,
} from '../../dependency/enum/security.enum.js';

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

  /** Storage key of the encrypted avatar file (served via GET /users/:id/avatar). */
  @Prop({ type: String, default: null })
  avatarKey?: string | null;

  @Prop({ type: String, trim: true })
  avatarUrl?: string;

  @Prop({ required: true, enum: Object.values(SystemRoleEnum), type: String, index: true })
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

  /** When the user accepted the privacy policy / consent at sign-up (NFR11). */
  @Prop({ type: Date, default: null })
  consentAcceptedAt?: Date | null;

  /** Admins can disable an account; disabled users cannot log in. */
  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String, default: 'en' })
  lang?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ name: 'text', email: 'text' });
