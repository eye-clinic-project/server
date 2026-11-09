import { Module } from '@nestjs/common';
import { FundusImageModule } from '../fundus-image/fundus-image.module.js';
import { HardwareService } from './hardware.service.js';
import { DeviceController, HardwareController } from './hardware.controller.js';
import { DeviceGuard } from './device.guard.js';

@Module({
  imports: [FundusImageModule],
  controllers: [HardwareController, DeviceController],
  providers: [HardwareService, DeviceGuard],
})
export class HardwareModule {}
