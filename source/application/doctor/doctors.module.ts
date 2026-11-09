import { Module } from '@nestjs/common';
import { DoctorsService } from './doctors.service.js';
import { DoctorsController } from './doctors.controller.js';
import { PatientModule } from '../patient/patient.module.js';
import { AppointmentModule } from '../appointment/appointment.module.js';

@Module({
  imports: [PatientModule, AppointmentModule],
  controllers: [DoctorsController],
  providers: [DoctorsService],
})
export class DoctorsModule {}
