import { IsMongoId, IsOptional } from 'class-validator';

import { ConversationRoomDto } from './conversation-room.dto.js';

export class ReadDto extends ConversationRoomDto {
  @IsOptional()
  @IsMongoId()
  messageId?: string;
}
