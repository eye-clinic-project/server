import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service.js';
import { AnalysisController } from './analysis.controller.js';
// import { AnalysisResolver } from './analysis.resolver.js';
import { AnalysisRepository } from '../../core/database/repository/analysis.repository.js';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/role.guard.js';

@Module({
  controllers: [AnalysisController],
  providers: [
    AnalysisService,
    // AnalysisResolver,
    AnalysisRepository,
    AuthGuard,
    RolesGuard,
  ],
})
export class AnalysisModule {}
