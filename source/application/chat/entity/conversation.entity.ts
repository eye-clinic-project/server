import type { Types } from 'mongoose';

import { ChatParticipantEntity } from './chat-participant.entity.js';
import { MessageEntity } from './message.entity.js';

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
