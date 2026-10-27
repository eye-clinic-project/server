import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  clinicName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(250)
  clinicAddress!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialty?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  licenseNumber?: string;
}
