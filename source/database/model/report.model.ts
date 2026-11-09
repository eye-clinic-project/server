import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import { Analysis } from './analysis.model.js';
import { IReport } from '../../dependency/interface/database-schema.interface.js';
import { ReportStatus } from '../../dependency/enum/database.enum.js';

export type HReportDocument = HydratedDocument<IReport>;

@Schema({ timestamps: true, collection: 'reports' })
export class Report {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  doctor: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  patient: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Analysis.name, required: true })
  analysis: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'DoctorReview', default: null })
  review?: Types.ObjectId | null;

  @Prop({ required: true, trim: true })
  title: string;

  /** Doctor notes. */
  @Prop({ trim: true })
  content?: string;

  @Prop({ trim: true })
  recommendations?: string;

  @Prop({ type: String, enum: Object.values(ReportStatus), default: ReportStatus.DRAFT })
  status: ReportStatus;

  @Prop({ type: Date, default: null })
  sentAt?: Date | null;

  @Prop({ type: Date, default: null })
  viewedAt?: Date | null;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
ReportSchema.index({ patient: 1, createdAt: -1 });
