import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/role.guard.js';
import { AnalysisRepository } from '../../core/database/repository/analysis.repository.js';
import { AppointmentRepository } from '../../core/database/repository/appointment.repository.js';
import { DoctorPatientRepository } from '../../core/database/repository/doctor-patient.repository.js';
import { PatientRepository } from '../../core/database/repository/patient.repository.js';
import { ReportRepository } from '../../core/database/repository/report.repository.js';
import { UserRepository } from '../../core/database/repository/user.repository.js';
import { PatientService } from './patient.service.js';
import { PatientController } from './patient.controller.js';
import { PatientResolver } from './patient.resolver.js';

@Module({
  controllers: [PatientController],
  providers: [
    PatientService,
    PatientResolver,
    AuthGuard,
    RolesGuard,
    PatientRepository,
    DoctorPatientRepository,
    AnalysisRepository,
    AppointmentRepository,
    ReportRepository,
    UserRepository,
  ],
  exports: [PatientService],
})
export class PatientModule {}
