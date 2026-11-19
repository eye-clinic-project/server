import { IsBoolean, IsDate, IsIn, IsInt, IsOptional, IsString, MaxLength, MinDate } from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { DR_LEVEL_VALUES, type DRLevel } from '../../../dependencies/enum/index.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateReviewDto {
  @IsBoolean()
  aiResultConfirmed!: boolean;

  @Type(() => Number)
  @IsInt()
  @IsIn(DR_LEVEL_VALUES)
  confirmedLevel!: DRLevel;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  recommendations?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @MinDate(() => new Date())
  followUpDate?: Date;
}
