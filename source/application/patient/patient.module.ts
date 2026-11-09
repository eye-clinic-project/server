import { Module } from '@nestjs/common';
import { PatientService } from './patient.service.js';
import { PatientController } from './patient.controller.js';
import { AuthenticationModule } from '../authentication/authentication.module.js';
import { AnalysisModule } from '../analysis/analysis.module.js';
import { ReportModule } from '../report/report.module.js';

@Module({
  imports: [AuthenticationModule, AnalysisModule, ReportModule],
  controllers: [PatientController],
  providers: [PatientService],
  exports: [PatientService],
})
export class PatientModule {}
