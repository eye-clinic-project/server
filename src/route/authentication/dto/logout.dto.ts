import { IsEnum } from 'class-validator';
import { LogoutTypeEnum } from '../../../common/enum/security.enum.js';

export class LogoutDto {
  @IsEnum(LogoutTypeEnum)
  action!: LogoutTypeEnum;
}
