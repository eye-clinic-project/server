import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service.js';
import { AnalysisController } from './analysis.controller.js';

@Module({
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
