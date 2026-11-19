import type { Types } from 'mongoose';

import { AttachmentEntity } from './attachment.entity.js';
import { attachmentType } from './chat.type.js';

export const toAttachmentEntity = (messageId: Types.ObjectId, key: string, index: number, baseUrl: string): AttachmentEntity => {
  const contentType = attachmentType(key);
  return new AttachmentEntity(index, `${baseUrl}/chat/attachments/${messageId.toString()}/${index}`, contentType, contentType.startsWith('image/'));
};
