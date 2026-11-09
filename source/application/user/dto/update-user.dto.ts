import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

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
  @Matches(/^\+?[0-9 ()-]{6,20}$/, { message: 'phone must be a valid phone number' })
  phone?: string;

  @IsOptional()
  @IsIn(['en', 'ar'])
  lang?: string;
}

export class DeleteAccountDto {
  /** Required for email/password accounts. */
  @IsOptional()
  @IsString()
  @MaxLength(72)
  password?: string;
}
