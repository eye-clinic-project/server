import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CaptureSessionStatus, DeviceStatus, EyeSide } from '../../../dependency/enum/database.enum.js';
import { PaginationQueryDto } from '../../../dependency/dto/pagination.dto.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateDeviceDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(100)
  name!: string;

  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(100)
  serialNumber!: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(100)
  model?: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(200)
  location?: string;
}

export class UpdateDeviceDto {
  @IsOptional() @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(100)
  name?: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(100)
  model?: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(200)
  location?: string;

  @IsOptional() @IsEnum(DeviceStatus)
  status?: DeviceStatus;
}

export class CreateCaptureSessionDto {
  @IsMongoId()
  deviceId!: string;

  @IsMongoId()
  patientId!: string;

  @IsOptional() @IsEnum(EyeSide)
  eye?: EyeSide;

  /** Run the AI analysis automatically when the image arrives (default true). */
  @IsOptional() @IsBoolean()
  autoAnalyze?: boolean;
}

export class UpdateCaptureSessionDto {
  @IsIn([CaptureSessionStatus.CAPTURING, CaptureSessionStatus.CANCELLED])
  status!: CaptureSessionStatus.CAPTURING | CaptureSessionStatus.CANCELLED;
}

export class CaptureSessionQueryDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(CaptureSessionStatus)
  status?: CaptureSessionStatus;

  @IsOptional() @IsMongoId()
  deviceId?: string;
}

export class DeviceFailureDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(500)
  error!: string;
}

export class DeviceUploadDto {
  @IsOptional() @IsEnum(EyeSide)
  eye?: EyeSide;
}
