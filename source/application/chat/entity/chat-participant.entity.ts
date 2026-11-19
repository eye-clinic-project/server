import type { Types } from 'mongoose';

import type { SystemRoleEnum } from '../../../dependencies/enum/index.js';

export class ChatParticipantEntity {
  constructor(
    public readonly _id: Types.ObjectId,
    public readonly name: string,
    public readonly avatarUrl: string | null,
    public readonly role: SystemRoleEnum,
  ) {}
}
