import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import { IPatient } from '../../dependency/interface/database-schema.interface.js';
import { DiabetesType, GenderEnum } from '../../dependency/enum/database.enum.js';

export type HPatientDocument = HydratedDocument<IPatient>;

@Schema({ timestamps: true, collection: 'patients' })
export class Patient {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, unique: true })
  user: Types.ObjectId;

  /** Human-friendly patient ID used for search (FR2.2), e.g. "P-7K3Q9D". */
  @Prop({ type: String, required: true, unique: true, uppercase: true, trim: true })
  medicalRecordNumber: string;

  @Prop({ type: Date })
  dateOfBirth?: Date;

  @Prop({ type: String, enum: Object.values(GenderEnum) })
  gender?: string;

  @Prop({ trim: true })
  emergencyContact?: string;

  @Prop({ type: String, enum: Object.values(DiabetesType) })
  diabetesType?: DiabetesType;

  /** Year of diabetes diagnosis. */
  @Prop({ type: Number, min: 1900 })
  diabetesSince?: number;

  @Prop({ trim: true })
  medicalNotes?: string;

  /** Doctor who created this patient record (FR2.1), if any. */
  @Prop({ type: Types.ObjectId, ref: User.name, default: null })
  createdBy?: Types.ObjectId | null;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
