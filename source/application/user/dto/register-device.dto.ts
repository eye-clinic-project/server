import { IsEnum } from 'class-validator';

import { DevicePlatform } from '../../../dependencies/enum/database.enum.js';
import { DeviceTokenDto } from './device-token.dto.js';

export class RegisterDeviceDto extends DeviceTokenDto {
  @IsEnum(DevicePlatform)
  platform: DevicePlatform;
}
