import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import { DoctorVerificationStatus } from '../../dependency/enum/database.enum.js';
import { IDoctor } from '../../dependency/interface/database-schema.interface.js';

export type HDoctorDocument = HydratedDocument<IDoctor>;

@Schema({ timestamps: true, collection: 'doctors' })
export class Doctor {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, unique: true })
  user: Types.ObjectId;

  @Prop({ required: true, trim: true })
  clinicName: string;

  @Prop({ required: true, trim: true })
  clinicAddress: string;

  @Prop({ trim: true })
  specialty?: string;

  @Prop({ trim: true, unique: true, sparse: true })
  licenseNumber?: string;

  @Prop({ trim: true })
  bio?: string;

  @Prop({ type: Number, min: 0 })
  yearsOfExperience?: number;

  /** New doctors start pending; an admin checks the license before they can use the doctor panel. */
  @Prop({
    type: String,
    enum: Object.values(DoctorVerificationStatus),
    default: DoctorVerificationStatus.PENDING,
    index: true,
  })
  verificationStatus: DoctorVerificationStatus;

  @Prop({ type: Date, default: () => new Date() })
  verificationSubmittedAt?: Date | null;

  @Prop({ type: Date, default: null })
  verifiedAt?: Date | null;

  @Prop({ type: Types.ObjectId, ref: User.name, default: null })
  verifiedBy?: Types.ObjectId | null;

  @Prop({ type: String, trim: true, default: null })
  rejectionReason?: string | null;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
