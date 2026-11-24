import type { Types } from 'mongoose';

import { AttachmentEntity, toAttachmentEntity } from './attachment.entity.js';
import type { MessageView } from './chat.type.js';

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

export const toMessageEntity = (message: MessageView, baseUrl: string, clientId?: string): MessageEntity =>
  new MessageEntity(
    message._id,
    message.conversation,
    message.sender,
    message.message,
    (message.attachments ?? []).map((key, index) => toAttachmentEntity(message._id, key, index, baseUrl)),
    message.readBy ?? [],
    message.createdAt,
    clientId || undefined,
  );
