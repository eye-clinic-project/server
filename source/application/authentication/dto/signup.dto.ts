import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { SignUpRoleEnum } from '../../../dependency/enum/security.enum.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class SignUpDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
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

  @ApiPropertyOptional({ enum: SignUpRoleEnum, default: SignUpRoleEnum.PATIENT })
  @IsOptional()
  @IsEnum(SignUpRoleEnum)
  role?: SignUpRoleEnum = SignUpRoleEnum.PATIENT;

  @ApiPropertyOptional({
    description: 'User accepted the privacy policy and consent (NFR11)',
  })
  @IsOptional()
  @IsBoolean()
  acceptTerms?: boolean;

  @ApiPropertyOptional({ description: 'Required when role = doctor' })
  @ValidateIf((o: SignUpDto) => o.role === SignUpRoleEnum.DOCTOR)
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  clinicName?: string;

  @ApiPropertyOptional({ description: 'Required when role = doctor' })
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

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(50)
  licenseNumber?: string;
}

export class SignUpResponseDto {
  @ApiProperty() email!: string;
  @ApiProperty() emailVerificationRequired!: boolean;
}
