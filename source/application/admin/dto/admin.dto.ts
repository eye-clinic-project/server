import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { SearchQueryDto } from '../../../dependency/dto/pagination.dto.js';
import { SystemRoleEnum } from '../../../dependency/enum/security.enum.js';

export class AdminUserQueryDto extends SearchQueryDto {
  @IsOptional()
  @IsEnum(SystemRoleEnum)
  role?: SystemRoleEnum;

  @IsOptional()
  @Transform(({ value }) => value === undefined ? undefined : value === true || value === 'true')
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateUserStatusDto {
  @IsBoolean()
  isActive!: boolean;
}

export class UpdateUserRoleDto {
  @IsEnum(SystemRoleEnum)
  role!: SystemRoleEnum;
}
