import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import type { IConversation } from '../../../common/interface/database-schema.interface.js';

export type HConversationDocument = HydratedDocument<IConversation>;
@Schema({
  timestamps: true,
  collection: 'conversations',
})
export class Conversation {
  @Prop({
    type: [Types.ObjectId],
    ref: User.name,
    required: true,
    validate: {
      validator: (participants: Types.ObjectId[]) => participants.length >= 2,
      message: 'A conversation must have at least two participants',
    },
  })
  participants: Types.ObjectId[];

  @Prop({
    type: Types.ObjectId,
    ref: 'Message',
    default: null,
  })
  lastMessage?: Types.ObjectId;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
