import { IsEnum, IsMongoId, IsNotEmpty, IsString, MaxLength, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

import { RescheduleReason } from '../../../dependencies/enum/database.enum.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class RescheduleRequestDto {
  @IsMongoId()
  slotId!: string;

  @IsEnum(RescheduleReason)
  reason!: RescheduleReason;

  @ValidateIf((o: RescheduleRequestDto) => o.reason === RescheduleReason.OTHER || o.note !== undefined)
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  note?: string;
}
