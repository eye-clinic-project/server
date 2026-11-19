import { IsDate, IsEnum, IsInt, IsOptional, IsString, Matches, Max, MaxDate, MaxLength, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { i18nValidationMessage } from '@nestjs/i18n';

import { GenderEnum } from '../../../dependencies/enum/index.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

const PHONE = /^\+?[0-9\s-]{7,20}$/;

export class PatientProfileDto {
  @IsOptional()
  @Transform(trim)
  @Matches(PHONE, { message: i18nValidationMessage('validation.custom.phone') })
  phone?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @MaxDate(() => new Date(), { message: i18nValidationMessage('validation.custom.notInFuture') })
  dateOfBirth?: Date;

  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  emergencyContact?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  diabetesSince?: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  medicalNotes?: string;
}
