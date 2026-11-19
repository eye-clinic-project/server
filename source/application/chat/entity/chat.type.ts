import type { Types } from 'mongoose';

import type { IConversation, IMessage, IUser } from '../../../dependencies/interface/index.js';
import { MessageEntity } from './message.entity.js';

export const CHAT_USER_FIELDS = 'name avatarUrl role';

export type ChatUser = Pick<IUser, 'name' | 'avatarUrl' | 'role'> & { _id: Types.ObjectId };

export type MessageView = IMessage & { _id: Types.ObjectId; createdAt: Date };

export type ConversationView = Omit<IConversation, 'doctor' | 'patient' | 'lastMessage'> & {
  _id: Types.ObjectId;
  doctor: ChatUser;
  patient: ChatUser;
  lastMessage?: MessageView | null;
};

export const ATTACHMENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

export const attachmentType = (key: string): string => ATTACHMENT_TYPES[key.split('.').pop() ?? ''] ?? 'application/octet-stream';

export interface MessagePage {
  docs: MessageEntity[];
  nextBefore: Date | null;
}
