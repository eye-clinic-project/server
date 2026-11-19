import { IsEnum, IsMongoId, IsOptional } from 'class-validator';

import { PageDto } from './page.dto.js';
import { ReportStatus } from '../../../dependencies/enum/index.js';

export class ListReportsDto extends PageDto {
  @IsOptional()
  @IsMongoId()
  patientId?: string;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}
