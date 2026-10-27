import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IAnalysis } from '../../../common/interface/database-schema.interface.js';

export type HAnalysisDocument = HydratedDocument<IAnalysis>;

@Schema({ timestamps: true, collection: 'analyses' })
export class Analysis {}

export const AnalysisSchema = SchemaFactory.createForClass(Analysis);
AnalysisSchema.index({ patient: 1, createdAt: -1 });
