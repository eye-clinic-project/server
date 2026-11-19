import { ArrayMaxSize, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { AttachmentUploadDto } from './attachment-upload.dto.js';
import { ConversationRoomDto } from './conversation-room.dto.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export const MAX_ATTACHMENTS = 4;

export class SendMessageDto extends ConversationRoomDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(4000)
  message?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @ArrayMaxSize(MAX_ATTACHMENTS)
  @Type(() => AttachmentUploadDto)
  attachments?: AttachmentUploadDto[];

  @IsOptional()
  @IsString()
  @MaxLength(64)
  clientId?: string;
}
