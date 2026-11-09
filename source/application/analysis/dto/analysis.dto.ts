import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../dependency/dto/pagination.dto.js';
import { AnalysisStatus } from '../../../dependency/enum/database.enum.js';

export class CreateAnalysisDto {
  @IsMongoId()
  imageId!: string;
}

export class AnalysisQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsMongoId()
  patientId?: string;

  @IsOptional()
  @IsMongoId()
  imageId?: string;

  @IsOptional()
  @IsEnum(AnalysisStatus)
  status?: AnalysisStatus;
}
