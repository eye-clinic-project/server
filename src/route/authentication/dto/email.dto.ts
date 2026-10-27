import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MaxLength } from 'class-validator';

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
  @Matches(/^\d{6}$/)
  otp!: string;
}
