import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IReport } from '../../../common/interface/database-schema.interface.js';

export type HReportDocument = HydratedDocument<IReport>;

@Schema({
  timestamps: { createdAt: 'generatedAt', updatedAt: false },
  collection: 'reports',
})
export class Report {}

export const ReportSchema = SchemaFactory.createForClass(Report);
