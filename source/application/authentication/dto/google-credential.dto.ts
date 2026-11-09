import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SignUpRoleEnum } from '../../../dependency/enum/security.enum.js';

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
