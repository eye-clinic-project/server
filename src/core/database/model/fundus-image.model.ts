import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import { IFundusImage } from '../../../common/interface/database-schema.interface.js';

export type HFundusImageDocument = HydratedDocument<IFundusImage>;

@Schema({
  timestamps: true,
  collection: 'fundusImages',
})
export class FundusImage {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  patient: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  uploadedBy: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  imageUrl: string;
}

export const FundusImageSchema = SchemaFactory.createForClass(FundusImage);
