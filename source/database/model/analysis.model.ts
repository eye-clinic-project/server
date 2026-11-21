import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import { FundusImage } from './fundus-image.model.js';
import { IAnalysis } from '../../dependencies/interface/index.js';
import { AnalysisStatus, DR_LEVEL_VALUES, Stage1Status } from '../../dependencies/enum/index.js';

export type HAnalysisDocument = HydratedDocument<IAnalysis>;

@Schema({ _id: false })
class AnalysisHistoryEntry {
  @Prop({ type: String, enum: AnalysisStatus, required: true })
  status: AnalysisStatus;

  @Prop({ type: String })
  message?: string;

  @Prop({ type: Date, default: Date.now })
  at: Date;

  @Prop({ type: Types.ObjectId, ref: User.name, default: null })
  by?: Types.ObjectId | null;
}
const AnalysisHistoryEntrySchema = SchemaFactory.createForClass(AnalysisHistoryEntry);

@Schema({ _id: false })
class AnalysisFinding {
  @Prop({ type: String, required: true })
  code: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Number, min: 0, max: 1, required: true })
  probability: number;

  @Prop({ type: Number, min: 0, max: 1, required: true })
  threshold: number;

  @Prop({ type: Boolean, required: true })
  detected: boolean;
}
const AnalysisFindingSchema = SchemaFactory.createForClass(AnalysisFinding);

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

  @Prop({ type: Boolean, default: null })
  hasDR?: boolean | null;

  @Prop({ type: Number, min: 0, max: 1, default: null })
  stage1Confidence?: number | null;

  /** Stage-1 ensemble probability for the D (diabetic retinopathy) class. */
  @Prop({ type: Number, min: 0, max: 1, default: null })
  drProbability?: number | null;

  /** Threshold the D probability was compared against. */
  @Prop({ type: Number, min: 0, max: 1, default: null })
  drThreshold?: number | null;

  @Prop({ type: String, enum: [...Object.values(Stage1Status), null], default: null })
  stage1Status?: Stage1Status | null;

  /** Finding codes to display: the detected ones, or the top suspected ones when nothing passed its threshold. */
  @Prop({ type: [String], default: [] })
  shownFindings?: string[];

  @Prop({ type: String, default: null })
  topFinding?: string | null;

  /** Finding code the Grad-CAM heatmap was computed for. */
  @Prop({ type: String, default: null })
  gradCamClass?: string | null;

  /** Stage-2 output: one of the five grades (FR3.4). */
  @Prop({ type: Number, enum: [...DR_LEVEL_VALUES, null], default: null })
  predictedLevel?: number | null;

  @Prop({ type: Number, min: 0, max: 1, default: null })
  confidence?: number | null;

  @Prop({ type: [Number], default: [] })
  probabilities?: number[];

  @Prop({ type: [AnalysisFindingSchema], default: [] })
  findings?: AnalysisFinding[];

  @Prop({ type: String, default: null })
  modelVersion?: string | null;

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

  @Prop({ type: Date, default: null })
  reviewedAt?: Date | null;

  @Prop({ type: [AnalysisHistoryEntrySchema], default: [] })
  history: AnalysisHistoryEntry[];
}

export const AnalysisSchema = SchemaFactory.createForClass(Analysis);
AnalysisSchema.index({ patient: 1, createdAt: -1 });
AnalysisSchema.index({ image: 1, createdAt: -1 });
AnalysisSchema.index({ doctor: 1, status: 1, reviewedAt: 1, createdAt: -1 });
