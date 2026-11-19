import type { ConversationView } from './chat.type.js';
import { ConversationEntity } from './conversation.entity.js';
import { toChatParticipantEntity } from './chat-participant.mapper.js';
import { toMessageEntity } from './message.mapper.js';

export const toConversationEntity = (conversation: ConversationView, baseUrl: string, unreadCount = 0): ConversationEntity =>
  new ConversationEntity(
    conversation._id,
    toChatParticipantEntity(conversation.doctor),
    toChatParticipantEntity(conversation.patient),
    conversation.lastMessage ? toMessageEntity(conversation.lastMessage, baseUrl) : null,
    conversation.lastMessageAt ?? null,
    unreadCount,
  );
