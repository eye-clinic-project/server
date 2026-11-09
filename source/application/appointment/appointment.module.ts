import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service.js';
import { AppointmentController } from './appointment.controller.js';

@Module({
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
