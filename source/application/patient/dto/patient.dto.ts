import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxDate,
  MaxLength,
  Min,
} from 'class-validator';
import { DiabetesType, GenderEnum } from '../../../dependency/enum/database.enum.js';
import { SearchQueryDto } from '../../../dependency/dto/pagination.dto.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdatePatientProfileDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @MaxDate(() => new Date(), { message: 'dateOfBirth cannot be in the future' })
  dateOfBirth?: Date;

  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: 'male' | 'female';

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  emergencyContact?: string;

  @IsOptional()
  @IsEnum(DiabetesType)
  diabetesType?: DiabetesType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  diabetesSince?: number;
}

/** Medical notes can only be edited by the treating doctor. */
export class DoctorUpdatePatientDto extends UpdatePatientProfileDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(4000)
  medicalNotes?: string;
}

/** FR2.1: a doctor creates a patient record (and account) with the required fields. */
export class CreatePatientDto extends DoctorUpdatePatientDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city!: string;

  @Type(() => Date)
  @IsDate()
  @MaxDate(() => new Date(), { message: 'dateOfBirth cannot be in the future' })
  declare dateOfBirth: Date;

  @IsEnum(GenderEnum)
  declare gender: 'male' | 'female';

  @IsOptional()
  @Transform(trim)
  @Matches(/^\+?[0-9 ()-]{6,20}$/, { message: 'phone must be a valid phone number' })
  phone?: string;

  @ApiPropertyOptional({ default: true, description: 'Email the patient a link to set their password' })
  @IsOptional()
  @IsBoolean()
  sendInvitation?: boolean = true;
}

export class PatientSearchQueryDto extends SearchQueryDto {}
