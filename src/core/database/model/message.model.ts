import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MessageStatus } from '../../../common/enum/schema.enum.js';

export type MessageDocument = HydratedDocument<Message>;

@Schema({
  timestamps: { createdAt: 'sentAt', updatedAt: false },
  collection: 'messages',
})
export class Message {}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ conversation: 1, sentAt: 1 });
