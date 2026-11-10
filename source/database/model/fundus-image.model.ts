import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import { IFundusImage } from '../../dependency/interface/database-schema.interface.js';
import { EyeSide, ImageSource } from '../../dependency/enum/database.enum.js';

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

  /** Key of the encrypted file in private storage. Never exposed as a public URL. */
  @Prop({ type: String, required: true, select: false })
  storageKey: string;

  @Prop({ type: String, required: true })
  mimeType: string;

  @Prop({ type: Number, required: true })
  size: number;

  /** Hash of the original bytes; proves the AI received the image unmodified (FR3.2). */
  @Prop({ type: String, required: true })
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
