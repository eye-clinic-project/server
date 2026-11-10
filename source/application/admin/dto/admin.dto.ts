import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { DoctorVerificationStatus } from '../../../dependency/enum/database.enum.js';
import { SearchQueryDto } from '../../../dependency/dto/pagination.dto.js';
import { SystemRoleEnum } from '../../../dependency/enum/security.enum.js';

export class AdminUserQueryDto extends SearchQueryDto {
  @IsOptional()
  @IsEnum(SystemRoleEnum)
  role?: SystemRoleEnum;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : value === true || value === 'true'))
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

export class AdminDoctorQueryDto extends SearchQueryDto {
  @IsOptional()
  @IsEnum(DoctorVerificationStatus)
  status?: DoctorVerificationStatus;
}

export class ReviewDoctorDto {
  @IsIn([DoctorVerificationStatus.APPROVED, DoctorVerificationStatus.REJECTED])
  status!: DoctorVerificationStatus.APPROVED | DoctorVerificationStatus.REJECTED;

  /** Shown to the doctor. Required when rejecting. */
  @ValidateIf((o: ReviewDoctorDto) => o.status === DoctorVerificationStatus.REJECTED || o.reason !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason?: string;
}
