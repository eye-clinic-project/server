import { i18nValidationMessage } from '@nestjs/i18n';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsInt, IsMongoId, IsOptional, Max, Min, MinDate } from 'class-validator';

export class CreateAvailabilityDto {
  @Type(() => Date)
  @IsDate()
  @MinDate(() => new Date(), { message: i18nValidationMessage('validation.custom.mustBeFuture') })
  startAt!: Date;

  @Type(() => Date)
  @IsDate()
  endAt!: Date;

  /** When set, the range is split into consecutive slots of this many minutes. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(240)
  slotMinutes?: number;
}

export class UpdateAvailabilityDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @MinDate(() => new Date(), { message: i18nValidationMessage('validation.custom.mustBeFuture') })
  startAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endAt?: Date;
}

export class AvailabilityQueryDto {
  @IsOptional()
  @IsMongoId()
  doctorId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  /** Only free slots (default true). */
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : value === true || value === 'true'))
  @IsBoolean()
  onlyAvailable?: boolean;
}
