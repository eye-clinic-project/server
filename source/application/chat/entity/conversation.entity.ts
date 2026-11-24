import type { Types } from 'mongoose';

import { ChatParticipantEntity, toChatParticipantEntity } from './chat-participant.entity.js';
import { MessageEntity, toMessageEntity } from './message.entity.js';
import type { ConversationView } from './chat.type.js';

export class ConversationEntity {
  constructor(
    public readonly _id: Types.ObjectId,
    public readonly doctor: ChatParticipantEntity,
    public readonly patient: ChatParticipantEntity,
    public readonly lastMessage: MessageEntity | null,
    public readonly lastMessageAt: Date | null,
    public readonly unreadCount: number,
  ) {}
}

export const toConversationEntity = (conversation: ConversationView, baseUrl: string, unreadCount = 0): ConversationEntity =>
  new ConversationEntity(
    conversation._id,
    toChatParticipantEntity(conversation.doctor),
    toChatParticipantEntity(conversation.patient),
    conversation.lastMessage ? toMessageEntity(conversation.lastMessage, baseUrl) : null,
    conversation.lastMessageAt ?? null,
    unreadCount,
  );
