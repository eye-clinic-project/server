import { Type } from 'class-transformer';
import {
  IsDate,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsMongoId()
  doctorId!: string;

  @Type(() => Date)
  @IsDate()
  scheduledAt!: Date;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1_000)
  notes?: string;
}
