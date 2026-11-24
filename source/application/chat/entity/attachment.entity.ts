import type { Types } from 'mongoose';
import { attachmentType } from './chat.type.js';

export class AttachmentEntity {
  constructor(
    public readonly index: number,
    public readonly url: string,
    public readonly contentType: string,
    public readonly isImage: boolean,
  ) {}
}

export const toAttachmentEntity = (messageId: Types.ObjectId, key: string, index: number, baseUrl: string): AttachmentEntity => {
  const contentType = attachmentType(key);
  return new AttachmentEntity(index, `${baseUrl}/chat/attachments/${messageId.toString()}/${index}`, contentType, contentType.startsWith('image/'));
};
