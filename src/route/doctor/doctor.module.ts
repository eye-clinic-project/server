import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/role.guard.js';
import { AnalysisRepository } from '../../core/database/repository/analysis.repository.js';
import { AppointmentRepository } from '../../core/database/repository/appointment.repository.js';
import { DoctorPatientRepository } from '../../core/database/repository/doctor-patient.repository.js';
import { DoctorRepository } from '../../core/database/repository/doctor.repository.js';
import { ReportRepository } from '../../core/database/repository/report.repository.js';
import { UserRepository } from '../../core/database/repository/user.repository.js';
import { DoctorService } from './doctor.service.js';
import { DoctorController } from './doctor.controller.js';

@Module({
  controllers: [DoctorController],
  providers: [
    DoctorService,
    AuthGuard,
    RolesGuard,
    DoctorRepository,
    DoctorPatientRepository,
    UserRepository,
    AnalysisRepository,
    AppointmentRepository,
    ReportRepository,
  ],
  exports: [DoctorService],
})
export class DoctorModule {}
