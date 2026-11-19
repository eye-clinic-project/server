import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import { IFundusImage } from '../../dependencies/interface/index.js';
import { EyeSide, ImageSource } from '../../dependencies/enum/index.js';

export type HFundusImageDocument = HydratedDocument<IFundusImage>;

@Schema({ timestamps: true, collection: 'fundusImages' })
export class FundusImage {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  patient: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  uploadedBy: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(EyeSide), default: EyeSide.UNKNOWN })
  eye: EyeSide;

  @Prop({ type: String, enum: Object.values(ImageSource), default: ImageSource.UPLOAD })
  source: ImageSource;

  @Prop({ type: String, required: true })
  storageKey: string;

  @Prop({ type: String, required: true })
  mimeType: string;

  @Prop({ type: Number, required: true, min: 0 })
  size: number;

  @Prop({ type: String, required: true, index: true })
  sha256: string;

  @Prop({ type: String, trim: true })
  originalName?: string;

  @Prop({ type: String, trim: true })
  notes?: string;

  @Prop({ type: Date })
  capturedAt?: Date;
}

export const FundusImageSchema = SchemaFactory.createForClass(FundusImage);
FundusImageSchema.index({ patient: 1, createdAt: -1 });
