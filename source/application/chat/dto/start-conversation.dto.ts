import { IsMongoId } from 'class-validator';

export class StartConversationDto {
  @IsMongoId()
  participantId!: string;
}
