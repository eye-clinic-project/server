import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import { IAppointment } from '../../dependencies/interface/index.js';
import { AppointmentRequestStatus, AppointmentRequestType, AppointmentStatus, RescheduleReason, SystemRoleEnum } from '../../dependencies/enum/index.js';
import type { IAppointmentChangeRequest, IRescheduleEntry } from '../../dependencies/interface/index.js';

export type HAppointmentDocument = HydratedDocument<IAppointment>;

@Schema({ _id: false })
export class RescheduleEntry {
  @Prop({ type: Date, required: true })
  from: Date;

  @Prop({ type: Date, required: true })
  to: Date;

  @Prop({ type: String, enum: Object.values(RescheduleReason), required: true })
  reason: RescheduleReason;

  @Prop({ trim: true })
  note?: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  by: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(SystemRoleEnum), required: true })
  byRole: SystemRoleEnum;

  @Prop({ type: Date, required: true })
  at: Date;
}

const RescheduleEntrySchema = SchemaFactory.createForClass(RescheduleEntry);

@Schema({ _id: false })
export class AppointmentChangeRequest {
  @Prop({ type: String, enum: Object.values(AppointmentRequestType), required: true })
  type: AppointmentRequestType;

  @Prop({ type: String, enum: Object.values(AppointmentRequestStatus), default: AppointmentRequestStatus.PENDING })
  status: AppointmentRequestStatus;

  @Prop({ required: true, trim: true })
  reason: string;

  @Prop({ type: String, enum: Object.values(RescheduleReason) })
  rescheduleReason?: RescheduleReason;

  @Prop({ type: Types.ObjectId, ref: 'DoctorAvailability', default: null })
  slot?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  scheduledAt?: Date | null;

  @Prop({ type: Date, default: null })
  endAt?: Date | null;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  requestedBy: Types.ObjectId;

  @Prop({ type: Date, required: true })
  requestedAt: Date;

  @Prop({ type: Types.ObjectId, ref: User.name, default: null })
  decidedBy?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  decidedAt?: Date | null;

  @Prop({ type: String, trim: true, default: null })
  decisionNote?: string | null;
}

const AppointmentChangeRequestSchema = SchemaFactory.createForClass(AppointmentChangeRequest);

@Schema({ timestamps: true, collection: 'appointments' })
export class Appointment {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  doctor: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  patient: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'DoctorAvailability', default: null })
  slot?: Types.ObjectId | null;

  @Prop({ type: Date, required: true })
  scheduledAt: Date;

  @Prop({ type: Date })
  endAt?: Date;

  @Prop({
    type: String,
    enum: Object.values(AppointmentStatus),
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Prop({ trim: true })
  reason?: string;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: User.name, default: null })
  cancelledBy?: Types.ObjectId | null;

  @Prop({ trim: true })
  cancelReason?: string;

  @Prop({ type: [RescheduleEntrySchema], default: [] })
  rescheduleHistory: IRescheduleEntry[];

  @Prop({ type: AppointmentChangeRequestSchema, default: null })
  changeRequest?: IAppointmentChangeRequest | null;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
AppointmentSchema.index({ doctor: 1, scheduledAt: 1 });
AppointmentSchema.index({ patient: 1, scheduledAt: 1 });
AppointmentSchema.index({ doctor: 1, status: 1, scheduledAt: 1, endAt: 1 });
AppointmentSchema.index({ doctor: 1, 'changeRequest.status': 1 });
