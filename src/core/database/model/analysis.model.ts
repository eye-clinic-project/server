import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  AnalysisStatus,
  DrSeverity,
} from '../../../common/enum/schema.enum.js';

export type AnalysisDocument = HydratedDocument<Analysis>;

@Schema({ timestamps: true, collection: 'analyses' })
export class Analysis {}

export const AnalysisSchema = SchemaFactory.createForClass(Analysis);
AnalysisSchema.index({ patient: 1, createdAt: -1 });
