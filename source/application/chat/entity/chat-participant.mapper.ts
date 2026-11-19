import type { ChatUser } from './chat.type.js';
import { ChatParticipantEntity } from './chat-participant.entity.js';

export const toChatParticipantEntity = (user: ChatUser): ChatParticipantEntity =>
  new ChatParticipantEntity(user._id, user.name, user.avatarUrl ?? null, user.role);
