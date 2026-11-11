import { i18nValidationMessage } from '@nestjs/i18n';
import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class UpdateUserDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @Transform(trim)
  @Matches(/^\+?[0-9 ()-]{6,20}$/, { message: i18nValidationMessage('validation.custom.phone') })
  phone?: string;

  /** Preferred language for API messages; null = follow Accept-Language. */
  @IsOptional()
  @IsIn(['en', 'ar', null])
  lang?: string | null;
}

export class DeleteAccountDto {
  /** Required for email/password accounts. */
  @IsOptional()
  @IsString()
  @MaxLength(72)
  password?: string;
}
