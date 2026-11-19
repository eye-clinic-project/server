import type { Types } from 'mongoose';

import { AttachmentEntity } from './attachment.entity.js';

export class MessageEntity {
  constructor(
    public readonly _id: Types.ObjectId,
    public readonly conversation: Types.ObjectId,
    public readonly sender: Types.ObjectId,
    public readonly message: string,
    public readonly attachments: AttachmentEntity[],
    public readonly readBy: Types.ObjectId[],
    public readonly createdAt: Date,
    public readonly clientId?: string,
  ) {}
}
