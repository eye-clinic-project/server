import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsMongoId, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { AppointmentStatus } from '../../../dependency/enum/database.enum.js';
import { PaginationQueryDto } from '../../../dependency/dto/pagination.dto.js';

/**
 * Book an available slot: send slotId, or doctorId + scheduledAt (start of a free slot).
 * Doctors booking for a patient also send patientId.
 */
export class CreateAppointmentDto {
  @IsOptional()
  @IsMongoId()
  slotId?: string;

  @ValidateIf((o: CreateAppointmentDto) => !o.slotId)
  @IsMongoId()
  doctorId?: string;

  @ValidateIf((o: CreateAppointmentDto) => !o.slotId)
  @Type(() => Date)
  @IsDate()
  scheduledAt?: Date;

  @IsOptional()
  @IsMongoId()
  patientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

/** Reschedule (to another free slot) and/or edit notes. */
export class UpdateAppointmentDto {
  @IsOptional()
  @IsMongoId()
  slotId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledAt?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class CancelAppointmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class AppointmentQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @IsOptional()
  @IsMongoId()
  doctorId?: string;

  @IsOptional()
  @IsMongoId()
  patientId?: string;
}
