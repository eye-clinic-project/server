import { IsEnum } from 'class-validator';
import { LogoutTypeEnum } from '../../../dependency/enum/security.enum.js';


export class LogoutDto {
  @IsEnum(LogoutTypeEnum)
  action!: LogoutTypeEnum;
}
