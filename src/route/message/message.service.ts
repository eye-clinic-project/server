import { Injectable } from '@nestjs/common';
import { ChatService } from '../chat/chat.service.js';
import { UpdateMessageDto } from './dto/update-message.dto.js';

@Injectable()
export class MessageService {
  constructor(private readonly chat: ChatService) {}

  update(userId: string, messageId: string, dto: UpdateMessageDto) {
    return this.chat.editMessage(userId, messageId, dto.message);
  }

  remove(userId: string, messageId: string) {
    return this.chat.deleteMessage(userId, messageId);
  }
}
