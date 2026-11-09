import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../dependency/dto/pagination.dto.js';
import { NotificationType } from '../../../dependency/enum/database.enum.js';

export class NotificationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === undefined ? undefined : value === true || value === 'true')
  @IsBoolean()
  unread?: boolean;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}
