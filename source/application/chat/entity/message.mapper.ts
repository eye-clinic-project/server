import type { MessageView } from './chat.type.js';
import { MessageEntity } from './message.entity.js';
import { toAttachmentEntity } from './attachment.mapper.js';

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
