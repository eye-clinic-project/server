import { i18nValidationMessage } from '@nestjs/i18n';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  LogoutTypeEnum,
  SignUpRoleEnum,
} from '../../../dependency/enum/security.enum.js';

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

export class UpdateAuthenticationDto extends PartialType(SignUpDto) {}

export class LoginDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password!: string;
}

export class GoogleCredentialDto {
  @IsString()
  @MinLength(1)
  @MaxLength(8192)
  idToken!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city!: string;

  /** Only used when the Google sign-in creates a new account. Doctors complete their clinic details later via PATCH /doctors/me. */
  @IsOptional()
  @IsEnum(SignUpRoleEnum)
  role?: SignUpRoleEnum;

  @IsOptional()
  @IsBoolean()
  acceptTerms?: boolean;
}

export class EmailDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class VerifyEmailDto extends EmailDto {
  @IsString()
  @Matches(/^\d{6}$/, { message: i18nValidationMessage('validation.custom.otp') })
  otp!: string;
}

export class ForgotPasswordDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{43}$/, { message: i18nValidationMessage('validation.custom.resetToken') })
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(72)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}

export class LogoutDto {
  @IsEnum(LogoutTypeEnum)
  action!: LogoutTypeEnum;
}
