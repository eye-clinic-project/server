import type { Types } from 'mongoose';

import type { SystemRoleEnum } from '../../../dependencies/enum/security.enum.js';
import type { ChatUser } from './chat.type.js';

export class ChatParticipantEntity {
  constructor(
    public readonly _id: Types.ObjectId,
    public readonly name: string,
    public readonly avatarUrl: string | null,
    public readonly role: SystemRoleEnum,
  ) {}
}

export const toChatParticipantEntity = (user: ChatUser): ChatParticipantEntity =>
  new ChatParticipantEntity(user._id, user.name, user.avatarUrl ?? null, user.role);
