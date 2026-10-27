import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import { IDoctor } from '../../../common/interface/database-schema.interface.js';

export type HDoctorDocument = HydratedDocument<IDoctor>;

@Schema({
  timestamps: true,
  collection: 'doctors',
})
export class Doctor {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    unique: true,
  })
  user: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  clinicName: string;

  @Prop({
    required: true,
    trim: true,
  })
  clinicAddress: string;

  @Prop({
    trim: true,
  })
  specialty?: string;

  @Prop({
    trim: true,
    unique: true,
    sparse: true,
  })
  licenseNumber?: string;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
