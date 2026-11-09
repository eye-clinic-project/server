import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import { IDoctorAvailability } from '../../dependency/interface/database-schema.interface.js';

export type HDoctorAvailabilityDocument = HydratedDocument<IDoctorAvailability>;

@Schema({ timestamps: true, collection: 'doctor_availability' })
export class DoctorAvailability {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  doctor: Types.ObjectId;

  @Prop({ type: Date, required: true })
  startAt: Date;

  @Prop({ type: Date, required: true })
  endAt: Date;

  /** Flipped atomically when a patient books the slot, so a slot can only be booked once. */
  @Prop({ type: Boolean, default: false })
  isBooked: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Appointment', default: null })
  appointment?: Types.ObjectId | null;
}

export const DoctorAvailabilitySchema =
  SchemaFactory.createForClass(DoctorAvailability);
DoctorAvailabilitySchema.index({ doctor: 1, startAt: 1 }, { unique: true });
