import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import { DoctorVerificationStatus } from '../../dependencies/enum/database.enum.js';
import { IDoctor, ILicenseDocument } from '../../dependencies/interface/database.interface.js';

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

  @Prop({
    type: String,
    enum: Object.values(DoctorVerificationStatus),
    default: DoctorVerificationStatus.PENDING,
    index: true,
  })
  verificationStatus: DoctorVerificationStatus;

  @Prop({ type: Date, default: null })
  verificationSubmittedAt?: Date | null;

  @Prop({ type: Date, default: null })
  verifiedAt?: Date | null;

  @Prop({ type: Types.ObjectId, ref: User.name, default: null })
  verifiedBy?: Types.ObjectId | null;

  @Prop({ type: String, trim: true, default: null })
  rejectionReason?: string | null;

  @Prop({
    type: [
      {
        _id: false,
        key: { type: String, required: true },
        originalName: { type: String, required: true },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true },
        uploadedAt: { type: Date, required: true },
      },
    ],
    default: [],
  })
  licenseDocuments: ILicenseDocument[];
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
