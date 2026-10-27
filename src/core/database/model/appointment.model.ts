import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AppointmentStatus } from '../../../common/enum/schema.enum.js';
import { IAppointment } from '../../../common/interface/database-schema.interface.js';

export type HAppointmentDocument = HydratedDocument<IAppointment>;

@Schema({ timestamps: true, collection: 'appointments' })
export class Appointment {}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
AppointmentSchema.index({ doctor: 1, scheduledAt: 1 });
