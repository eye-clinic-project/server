import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import { IPatient } from '../../../common/interface/database-schema.interface.js';
import { GenderEnum } from '../../../common/enum/schema.enum.js';

export type HPatientDocument = HydratedDocument<IPatient>;

@Schema({
  timestamps: true,
  collection: 'patients',
})
export class Patient {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    unique: true,
  })
  user: Types.ObjectId;

  @Prop({
    type: Date,
  })
  dateOfBirth?: Date;

  @Prop({
    type: String,
    enum: GenderEnum,
  })
  gender?: string;

  @Prop({
    trim: true,
  })
  emergencyContact?: string;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
