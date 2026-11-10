import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import { FundusImage } from './fundus-image.model.js';
import { IAnalysis } from '../../dependency/interface/database-schema.interface.js';
import { AnalysisStatus, DR_LEVEL_VALUES } from '../../dependency/enum/database.enum.js';

export type HAnalysisDocument = HydratedDocument<IAnalysis>;

@Schema({ _id: false })
class AnalysisHistoryEntry {
  @Prop({ type: String, enum: Object.values(AnalysisStatus), required: true })
  status: AnalysisStatus;

  @Prop({ type: String })
  message?: string;

  @Prop({ type: Date, default: Date.now })
  at: Date;

  @Prop({ type: Types.ObjectId, ref: User.name, default: null })
  by?: Types.ObjectId | null;
}
const AnalysisHistoryEntrySchema = SchemaFactory.createForClass(AnalysisHistoryEntry);

@Schema({ timestamps: true, collection: 'analyses' })
export class Analysis {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  doctor: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  patient: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: FundusImage.name, required: true })
  image: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(AnalysisStatus),
    default: AnalysisStatus.PENDING,
    index: true,
  })
  status: AnalysisStatus;

  /** Stage-1 output: DR / No DR (FR3.3). */
  @Prop({ type: Boolean, default: null })
  hasDR?: boolean | null;

  @Prop({ type: Number, min: 0, max: 1, default: null })
  stage1Confidence?: number | null;

  /** Stage-2 output: one of the five grades (FR3.4). */
  @Prop({ type: Number, enum: [...DR_LEVEL_VALUES, null], default: null })
  predictedLevel?: number | null;

  @Prop({ type: Number, min: 0, max: 1, default: null })
  confidence?: number | null;

  /** Per-class probabilities [NoDR, Mild, Moderate, Severe, PDR] after TTA. */
  @Prop({ type: [Number], default: [] })
  probabilities?: number[];

  @Prop({ type: String, default: null, select: false })
  gradCamKey?: string | null;

  @Prop({ type: String, default: null })
  modelVersion?: string | null;

  /** True when produced by AI_MODE=mock (demo only, not a real prediction). */
  @Prop({ type: Boolean, default: false })
  isMock?: boolean;

  @Prop({ type: String, default: null })
  error?: string | null;

  @Prop({ type: Number, default: 0 })
  attempts: number;

  @Prop({ type: Number, default: null })
  processingMs?: number | null;

  @Prop({ type: Date, default: null })
  completedAt?: Date | null;

  @Prop({ type: [AnalysisHistoryEntrySchema], default: [] })
  history: AnalysisHistoryEntry[];
}

export const AnalysisSchema = SchemaFactory.createForClass(Analysis);
AnalysisSchema.index({ patient: 1, createdAt: -1 });
AnalysisSchema.index({ image: 1, createdAt: -1 });
