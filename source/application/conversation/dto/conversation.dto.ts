import { Transform, Type } from 'class-transformer';
import { IsDate, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateConversationDto {
  /** The other user (your doctor, or your patient). */
  @IsMongoId()
  participantId!: string;
}

export class SendMessageDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message!: string;
}

export class MessagesQueryDto {
  /** Return messages older than this date (cursor pagination). */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  before?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 30;
}
