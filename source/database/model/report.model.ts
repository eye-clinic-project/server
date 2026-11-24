import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import { Analysis } from './analysis.model.js';
import { IReport } from '../../dependencies/interface/database.interface.js';
import { ReportStatus } from '../../dependencies/enum/database.enum.js';

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

  @Prop({ type: String, default: null, select: false })
  pdfKey?: string | null;

  @Prop({ type: Number, default: null })
  pdfSize?: number | null;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
ReportSchema.index({ patient: 1, createdAt: -1 });
ReportSchema.index({ analysis: 1 }, { unique: true });
