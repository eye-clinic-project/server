import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import { IAnalysis } from '../../../common/interface/database-schema.interface.js';
import { FundusImage } from './fundus-image.model.js';
import { DRLevel } from '../../../common/enum/schema.enum.js';

export type HAnalysisDocument = HydratedDocument<IAnalysis>;

@Schema({
  timestamps: true,
  collection: 'analyses',
})
export class Analysis {
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
    ref: FundusImage.name,
    required: true,
  })
  image: Types.ObjectId;

  @Prop({
    type: Number,
    enum: Object.values(DRLevel).filter((value) => typeof value === 'number'),
    required: true,
  })
  predictedLevel: DRLevel;

  @Prop({
    type: Number,
    min: 0,
    max: 1,
  })
  confidence?: number;

  @Prop({
    trim: true,
  })
  gradCamUrl?: string;
}

export const AnalysisSchema = SchemaFactory.createForClass(Analysis);

AnalysisSchema.index({ patient: 1, createdAt: -1 });
AnalysisSchema.index({ image: 1, createdAt: -1 });
