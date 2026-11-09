import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import { ICaptureSession } from '../../dependency/interface/database-schema.interface.js';
import {
  CaptureSessionStatus,
  EyeSide,
} from '../../dependency/enum/database.enum.js';

export type HCaptureSessionDocument = HydratedDocument<ICaptureSession>;

@Schema({ timestamps: true, collection: 'capture_sessions' })
export class CaptureSession {
  @Prop({ type: Types.ObjectId, ref: 'Device', required: true, index: true })
  device: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  doctor: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  patient: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(EyeSide), default: EyeSide.UNKNOWN })
  eye: EyeSide;

  @Prop({
    type: String,
    enum: Object.values(CaptureSessionStatus),
    default: CaptureSessionStatus.PENDING,
  })
  status: CaptureSessionStatus;

  @Prop({ type: Types.ObjectId, ref: 'FundusImage', default: null })
  image?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Analysis', default: null })
  analysis?: Types.ObjectId | null;

  @Prop({ type: Boolean, default: true })
  autoAnalyze: boolean;

  @Prop({ type: String, default: null })
  error?: string | null;

  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

export const CaptureSessionSchema = SchemaFactory.createForClass(CaptureSession);
