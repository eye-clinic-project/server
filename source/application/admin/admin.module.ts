import { Module } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AdminController } from './admin.controller.js';
import { UserModule } from '../user/user.module.js';
import { AnalysisModule } from '../analysis/analysis.module.js';
import { ReportModule } from '../report/report.module.js';

@Module({
  imports: [UserModule, AnalysisModule, ReportModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
