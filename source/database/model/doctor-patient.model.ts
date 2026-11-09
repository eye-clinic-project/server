import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import { IDoctorPatient } from '../../dependency/interface/database-schema.interface.js';
import { AssignmentStatus } from '../../dependency/enum/database.enum.js';

export type HDoctorPatientDocument = HydratedDocument<IDoctorPatient>;

@Schema({ timestamps: true, collection: 'doctor_patients' })
export class DoctorPatient {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  doctor: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  patient: Types.ObjectId;

  /** pending = requested by the patient and waiting for the doctor; active = assigned. */
  @Prop({
    type: String,
    enum: Object.values(AssignmentStatus),
    default: AssignmentStatus.ACTIVE,
  })
  status: AssignmentStatus;

  @Prop({ type: Date, default: Date.now })
  assignedAt: Date;

  @Prop({ type: Types.ObjectId, ref: User.name })
  assignedBy?: Types.ObjectId;

  @Prop({ type: Date, default: null })
  endedAt?: Date | null;

  @Prop({ trim: true })
  notes?: string;
}

export const DoctorPatientSchema = SchemaFactory.createForClass(DoctorPatient);
DoctorPatientSchema.index({ doctor: 1, patient: 1 }, { unique: true });
