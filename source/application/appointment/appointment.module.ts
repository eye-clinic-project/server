import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service.js';
import { AppointmentController } from './appointment.controller.js';

@Module({
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppointmentModule {}
