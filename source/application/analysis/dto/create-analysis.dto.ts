import { IsDate, IsEnum, IsMongoId, IsOptional, IsString, MaxDate, MaxLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { i18nValidationMessage } from '@nestjs/i18n';

import { EyeSide } from '../../../dependencies/enum/database.enum.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateAnalysisDto {
  @IsMongoId()
  patientId!: string;

  @IsOptional()
  @IsEnum(EyeSide)
  eye?: EyeSide;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @MaxDate(() => new Date(), { message: i18nValidationMessage('validation.custom.notInFuture') })
  capturedAt?: Date;
}
