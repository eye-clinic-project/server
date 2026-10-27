import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(5_000)
  message?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(2_048, { each: true })
  attachments?: string[];
}
