import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { LogoutTypeEnum } from '../../../dependencies/enum/security.enum.js';

export class LogoutDto {
  @IsEnum(LogoutTypeEnum)
  type!: LogoutTypeEnum;

  @ValidateIf((o: LogoutDto) => o.type === LogoutTypeEnum.SINGLE)
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  refreshToken?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  deviceToken?: string;
}
