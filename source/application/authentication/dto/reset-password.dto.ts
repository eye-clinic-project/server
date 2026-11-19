import { Transform } from 'class-transformer';
import { i18nValidationMessage } from '@nestjs/i18n';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const normalizeEmail = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);

export class ResetPasswordDto {
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: i18nValidationMessage('validation.custom.otp') })
  code!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
