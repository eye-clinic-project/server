import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import { IDoctorReview } from '../../dependency/interface/database-schema.interface.js';
import { DR_LEVEL_VALUES } from '../../dependency/enum/database.enum.js';

export type HDoctorReviewDocument = HydratedDocument<IDoctorReview>;

@Schema({ timestamps: true, collection: 'doctor_reviews' })
export class DoctorReview {
  @Prop({ type: Types.ObjectId, ref: 'Analysis', required: true, index: true })
  analysis: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  doctor: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  patient: Types.ObjectId;

  /** Whether the doctor agrees with the AI grade. */
  @Prop({ type: Boolean, required: true })
  aiResultConfirmed: boolean;

  @Prop({ type: Number, enum: DR_LEVEL_VALUES, required: true })
  confirmedLevel: number;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ trim: true })
  recommendations?: string;

  @Prop({ type: Date, default: null })
  followUpDate?: Date | null;
}

export const DoctorReviewSchema = SchemaFactory.createForClass(DoctorReview);
DoctorReviewSchema.index({ analysis: 1, doctor: 1 }, { unique: true });
