import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import { IConversation } from '../../dependency/interface/database-schema.interface.js';

export type HConversationDocument = HydratedDocument<IConversation>;

/** One conversation per doctor–patient pair (FR6.1). */
@Schema({ timestamps: true, collection: 'conversations' })
export class Conversation {
  @Prop({ type: [Types.ObjectId], ref: User.name, required: true, index: true })
  participants: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  doctor: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  patient: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Message', default: null })
  lastMessage?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  lastMessageAt?: Date | null;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ doctor: 1, patient: 1 }, { unique: true });
