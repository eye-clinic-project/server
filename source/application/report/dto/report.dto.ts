import { IsEnum, IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../dependency/dto/pagination.dto.js';
import { ReportStatus } from '../../../dependency/enum/database.enum.js';

export class CreateReportDto {
  @IsMongoId()
  analysisId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  /** Doctor notes. */
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  recommendations?: string;
}

export class UpdateReportDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  recommendations?: string;
}

export class ReportQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsMongoId()
  patientId?: string;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}
