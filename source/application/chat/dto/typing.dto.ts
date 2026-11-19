import { IsBoolean } from 'class-validator';

import { ConversationRoomDto } from './conversation-room.dto.js';

export class TypingDto extends ConversationRoomDto {
  @IsBoolean()
  isTyping!: boolean;
}
