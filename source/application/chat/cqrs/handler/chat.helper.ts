import { CHAT_USER_FIELDS } from '../../entity/chat.type.js';

export const populateConversation = [{ path: 'doctor', select: CHAT_USER_FIELDS }, { path: 'patient', select: CHAT_USER_FIELDS }, { path: 'lastMessage' }];
