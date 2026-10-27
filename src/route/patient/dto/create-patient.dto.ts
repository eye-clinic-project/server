import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { GenderEnum } from '../../../common/enum/schema.enum.js';

export class CreatePatientDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateOfBirth?: Date;

  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  emergencyContact?: string;
}
