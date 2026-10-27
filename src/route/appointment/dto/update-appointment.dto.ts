import { Type } from 'class-transformer';
import {
  IsDate,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateAppointmentDto {
  @Type(() => Date)
  @IsDate()
  scheduledAt!: Date;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1_000)
  notes?: string;
}
