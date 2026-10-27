import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { IMessage } from '../../../common/interface/database-schema.interface.js';
import { User } from './user.model.js';

export type HMessageDocument = HydratedDocument<IMessage>;

@Schema({
  timestamps: true,
  collection: 'messages',
})
export class Message {
  @Prop({
    type: Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  })
  conversation: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  sender: Types.ObjectId;

  @Prop({
    type: String,
    trim: true,
    default: '',
  })
  message: string;

  @Prop({
    type: [String],
    default: [],
  })
  attachments: string[];

  @Prop({
    type: [Types.ObjectId],
    ref: User.name,
    default: [],
  })
  deliveredTo: Types.ObjectId[];

  @Prop({
    type: [Types.ObjectId],
    ref: User.name,
    default: [],
  })
  readBy: Types.ObjectId[];

  @Prop({
    type: Date,
    default: null,
  })
  editedAt?: Date;

  @Prop({
    type: Date,
    default: null,
  })
  deletedAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ conversation: 1, createdAt: -1 });
