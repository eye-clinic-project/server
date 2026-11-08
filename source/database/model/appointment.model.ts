import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import { IAppointment } from '../../dependency/interface/database-schema.interface.js';
import { AppointmentStatus } from '../../dependency/enum/database.enum.js';

export type HAppointmentDocument = HydratedDocument<IAppointment>;

@Schema({
  timestamps: true,
  collection: 'appointments',
})
export class Appointment {
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
    required: true,
  })
  scheduledAt: Date;

  @Prop({
    type: String,
    enum: Object.values(AppointmentStatus),
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Prop({
    trim: true,
  })
  notes?: string;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

AppointmentSchema.index({ doctor: 1, scheduledAt: 1 });
AppointmentSchema.index({ patient: 1, scheduledAt: 1 });
