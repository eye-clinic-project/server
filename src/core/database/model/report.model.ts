import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IReport } from '../../../common/interface/database-schema.interface.js';
import { User } from './user.model.js';
import { Analysis } from './analysis.model.js';

export type HReportDocument = HydratedDocument<IReport>;

@Schema({
  timestamps: true,
  collection: 'reports',
})
export class Report {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  doctor: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  patient: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: Analysis.name,
    required: true,
  })
  analysis: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  title: string;

  @Prop({
    trim: true,
  })
  content?: string;

  @Prop({
    trim: true,
  })
  fileUrl?: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

ReportSchema.index({ patient: 1, createdAt: -1 });
