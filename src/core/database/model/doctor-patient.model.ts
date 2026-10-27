import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IDoctorPatient } from '../../../common/interface/database-schema.interface.js';
import { User } from './user.model.js';


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

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
  })
  assignedBy?: Types.ObjectId;
}

export const DoctorPatientSchema =
  SchemaFactory.createForClass(DoctorPatient);

DoctorPatientSchema.index(
  { doctor: 1, patient: 1 },
  { unique: true },
);