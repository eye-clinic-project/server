import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NotificationType } from '../../../common/enum/schema.enum.js';

export class CreateNotificationDto {
  @IsMongoId()
  recipientId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2_000)
  body!: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type: NotificationType = NotificationType.SYSTEM;
}
