import {
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateReportDto {
  @IsMongoId()
  patientId!: string;

  @IsMongoId()
  analysisId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  fileUrl?: string;
}
