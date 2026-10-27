import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service.js';
import { AnalysisController } from './analysis.controller.js';
import { AnalysisResolver } from './graphql/analysis.resolver.js';

@Module({
  controllers: [AnalysisController],
  providers: [AnalysisService, AnalysisResolver],
})
export class AnalysisModule {}
