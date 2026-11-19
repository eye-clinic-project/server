import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import { IPatient } from '../../dependencies/interface/index.js';
import { GenderEnum } from '../../dependencies/enum/index.js';

export type HPatientDocument = HydratedDocument<IPatient>;

@Schema({ timestamps: true, collection: 'patients' })
export class Patient {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, unique: true })
  user: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, uppercase: true, trim: true })
  medicalRecordNumber: string;

  @Prop({ type: Date })
  dateOfBirth?: Date;

  @Prop({ type: String, enum: Object.values(GenderEnum) })
  gender?: string;

  @Prop({ trim: true })
  emergencyContact?: string;

  @Prop({ type: Number, min: 1900 })
  diabetesSince?: number;

  @Prop({ trim: true })
  medicalNotes?: string;

  @Prop({ type: Types.ObjectId, ref: User.name, default: null })
  createdBy?: Types.ObjectId | null;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
