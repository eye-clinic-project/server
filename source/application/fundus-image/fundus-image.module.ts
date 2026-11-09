import { Module } from '@nestjs/common';
import { FundusImageService } from './fundus-image.service.js';
import { FundusImageController } from './fundus-image.controller.js';
import { AnalysisModule } from '../analysis/analysis.module.js';

@Module({
  imports: [AnalysisModule],
  controllers: [FundusImageController],
  providers: [FundusImageService],
  exports: [FundusImageService],
})
export class FundusImageModule {}
