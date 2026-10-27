import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/role.guard.js';
import { DoctorModule } from '../doctor/doctor.module.js';
import { ReportRepository } from '../../core/database/repository/report.repository.js';
import { ReportService } from './report.service.js';
import { ReportController } from './report.controller.js';

@Module({
  imports: [DoctorModule],
  controllers: [ReportController],
  providers: [
    ReportService,
    ReportRepository,
    AuthGuard,
    RolesGuard,
  ],
})
export class ReportModule {}
