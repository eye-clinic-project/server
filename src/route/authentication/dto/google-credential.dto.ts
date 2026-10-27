import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class GoogleCredentialDto {
  @IsString()
  @MinLength(1)
  @MaxLength(8192)
  idToken!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  city!: string;
}
