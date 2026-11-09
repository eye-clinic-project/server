import { Module } from '@nestjs/common';
import { DoctorPatientService } from './doctor-patient.service.js';
import { DoctorPatientController } from './doctor-patient.controller.js';

@Module({
  controllers: [DoctorPatientController],
  providers: [DoctorPatientService],
})
export class DoctorPatientModule {}
