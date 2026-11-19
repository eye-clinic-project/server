import { IsEnum } from 'class-validator';

import { DevicePlatform } from '../../../dependencies/enum/index.js';
import { DeviceTokenDto } from './device-token.dto.js';

export class RegisterDeviceDto extends DeviceTokenDto {
  @IsEnum(DevicePlatform)
  platform: DevicePlatform;
}
