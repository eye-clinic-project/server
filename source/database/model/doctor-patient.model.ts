import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { User } from './user.model.js';
import { IDoctorPatient } from '../../dependency/interface/database-schema.interface.js';

export type HDoctorPatientDocument = HydratedDocument<IDoctorPatient>;

@Schema({
  timestamps: true,
  collection: 'doctor_patients',
})
export class DoctorPatient {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  doctor: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  patient: Types.ObjectId;

  @Prop({
    type: Date,
    default: Date.now,
  })
  assignedAt: Date;
}

export const DoctorPatientSchema = SchemaFactory.createForClass(DoctorPatient);

DoctorPatientSchema.index({ doctor: 1, patient: 1 }, { unique: true });
