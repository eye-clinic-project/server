import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { SignUpRoleEnum } from '../../../dependencies/enum/security.enum.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class SignUpDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city!: string;

  @IsOptional()
  @IsEnum(SignUpRoleEnum)
  role?: SignUpRoleEnum = SignUpRoleEnum.PATIENT;

  @IsOptional()
  @IsBoolean()
  acceptTerms?: boolean;

  @ValidateIf((o: SignUpDto) => o.role === SignUpRoleEnum.DOCTOR)
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  clinicName?: string;

  @ValidateIf((o: SignUpDto) => o.role === SignUpRoleEnum.DOCTOR)
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

  @ValidateIf((o: SignUpDto) => o.role === SignUpRoleEnum.DOCTOR)
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  licenseNumber?: string;
}
