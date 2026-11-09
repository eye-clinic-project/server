import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsIn, IsInt, IsMongoId, IsOptional, IsString, MaxLength, MinDate } from 'class-validator';
import { DR_LEVEL_VALUES } from '../../../dependency/enum/database.enum.js';
import { PaginationQueryDto } from '../../../dependency/dto/pagination.dto.js';

export class CreateDoctorReviewDto {
  @IsMongoId()
  analysisId!: string;

  @IsBoolean()
  aiResultConfirmed!: boolean;

  /** Grade decided by the doctor (0-4). */
  @Type(() => Number)
  @IsInt()
  @IsIn([...DR_LEVEL_VALUES])
  confirmedLevel!: number;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  recommendations?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @MinDate(() => new Date(), { message: 'followUpDate must be in the future' })
  followUpDate?: Date;
}

class ReviewFields extends CreateDoctorReviewDto {}
export class UpdateDoctorReviewDto extends PartialType(ReviewFields) {
  declare analysisId?: undefined;
}

export class DoctorReviewQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsMongoId()
  analysisId?: string;

  @IsOptional()
  @IsMongoId()
  patientId?: string;
}
