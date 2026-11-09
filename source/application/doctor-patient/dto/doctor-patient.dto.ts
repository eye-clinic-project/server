import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsMongoId, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { AssignmentStatus } from '../../../dependency/enum/database.enum.js';
import { PaginationQueryDto } from '../../../dependency/dto/pagination.dto.js';

/**
 * Doctor: send patientId or patientEmail to assign a patient (active immediately).
 * Patient: send doctorId to request a doctor (pending until the doctor accepts).
 */
export class CreateAssignmentDto {
  @IsOptional()
  @IsMongoId()
  patientId?: string;

  @ValidateIf((o: CreateAssignmentDto) => !o.patientId && !o.doctorId)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  patientEmail?: string;

  @IsOptional()
  @IsMongoId()
  doctorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateAssignmentDto {
  @IsOptional()
  @IsEnum([AssignmentStatus.ACTIVE, AssignmentStatus.ENDED])
  status?: AssignmentStatus.ACTIVE | AssignmentStatus.ENDED;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class AssignmentQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;
}
