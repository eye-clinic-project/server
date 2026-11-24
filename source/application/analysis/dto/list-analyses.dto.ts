import { IsBoolean, IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

import { AnalysisStatus } from '../../../dependencies/enum/database.enum.js';
import { PageDto } from './page.dto.js';

const toBoolean = ({ value }: { value: unknown }) => (value === 'true' ? true : value === 'false' ? false : value);

export class ListAnalysesDto extends PageDto {
  @IsOptional()
  @IsMongoId()
  patientId?: string;

  @IsOptional()
  @IsEnum(AnalysisStatus)
  status?: AnalysisStatus;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  hasDR?: boolean;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  reviewed?: boolean;
}
