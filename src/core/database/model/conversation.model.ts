import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: true, collection: 'conversations' })
export class Conversation {}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ doctor: 1, patient: 1 }, { unique: true });
