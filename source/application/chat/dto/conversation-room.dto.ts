import { IsMongoId } from 'class-validator';

export class ConversationRoomDto {
  @IsMongoId()
  conversationId!: string;
}
