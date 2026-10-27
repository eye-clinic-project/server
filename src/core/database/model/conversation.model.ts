import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IConversation } from '../../../common/interface/database-schema.interface.js';

export type HConversationDocument = HydratedDocument<IConversation>;

@Schema({ timestamps: true, collection: 'conversations' })
export class Conversation {}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ doctor: 1, patient: 1 }, { unique: true });
