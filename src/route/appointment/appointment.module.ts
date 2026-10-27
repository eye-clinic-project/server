import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service.js';
import { AppointmentController } from './appointment.controller.js';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/role.guard.js';
import { AppointmentRepository } from '../../core/database/repository/appointment.repository.js';
import { DoctorModule } from '../doctor/doctor.module.js';
import { PatientModule } from '../patient/patient.module.js';

@Module({
  imports: [DoctorModule, PatientModule],
  controllers: [AppointmentController],
  providers: [AppointmentService, AppointmentRepository, AuthGuard, RolesGuard],
})
export class AppointmentModule {}
