import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReportDocument = HydratedDocument<Report>;

@Schema({
  timestamps: { createdAt: 'generatedAt', updatedAt: false },
  collection: 'reports',
})
export class Report {}

export const ReportSchema = SchemaFactory.createForClass(Report);
