import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AppointmentStatus } from '../../../common/enum/schema.enum.js';



export type AppointmentDocument = HydratedDocument<Appointment>;

@Schema({ timestamps: true, collection: 'appointments' })
export class Appointment {
  
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
AppointmentSchema.index({ doctor: 1, scheduledAt: 1 });