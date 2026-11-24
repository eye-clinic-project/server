import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { DoctorVerificationStatus } from '../../../dependencies/enum/database.enum.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

const toBoolean = ({ value }: { value: unknown }) => (value === 'true' ? true : value === 'false' ? false : value);

export class ListDoctorsDto {
  @IsOptional()
  @IsEnum(DoctorVerificationStatus)
  status?: DoctorVerificationStatus;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  submitted?: boolean;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  size?: number = 10;
}
