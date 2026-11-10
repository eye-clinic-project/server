import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { SearchQueryDto } from '../../../dependency/dto/pagination.dto.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class UpdateDoctorDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  clinicName?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  clinicAddress?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  specialty?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(50)
  licenseNumber?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(70)
  yearsOfExperience?: number;
}

export class DoctorSearchQueryDto extends SearchQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  specialty?: string;
}
