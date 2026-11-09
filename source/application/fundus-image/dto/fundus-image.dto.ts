import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';
import { EyeSide } from '../../../dependency/enum/database.enum.js';
import { PaginationQueryDto } from '../../../dependency/dto/pagination.dto.js';

const toBool = ({ value }: { value: unknown }) =>
  value === undefined ? undefined : value === true || value === 'true' || value === '1';

export class UploadFundusImageDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file?: unknown;

  @IsMongoId()
  patientId!: string;

  @ApiPropertyOptional({ enum: EyeSide })
  @IsOptional()
  @IsEnum(EyeSide)
  eye?: EyeSide;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  capturedAt?: Date;

  @ApiPropertyOptional({ default: true, description: 'Run the AI analysis right after the upload' })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  analyze?: boolean;
}

export class UpdateFundusImageDto {
  @IsOptional()
  @IsEnum(EyeSide)
  eye?: EyeSide;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  capturedAt?: Date;
}

export class FundusImageQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsMongoId()
  patientId?: string;

  @IsOptional()
  @IsEnum(EyeSide)
  eye?: EyeSide;
}
