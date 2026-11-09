import { Module } from '@nestjs/common';
import { DoctorAvailabilityService } from './doctor-availability.service.js';
import { DoctorAvailabilityController } from './doctor-availability.controller.js';

@Module({
  controllers: [DoctorAvailabilityController],
  providers: [DoctorAvailabilityService],
  exports: [DoctorAvailabilityService],
})
export class DoctorAvailabilityModule {}
