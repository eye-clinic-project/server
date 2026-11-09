import { Module } from '@nestjs/common';
import { FundusImageService } from './fundus-image.service.js';
import { FundusImageController } from './fundus-image.controller.js';

@Module({
  controllers: [FundusImageController],
  providers: [FundusImageService],
})
export class FundusImageModule {}
