import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule, ServiceModule } from '../../dependencies/module/index.js';
import { AppointmentController } from './appointment.controller.js';
import { AppointmentService } from './appointment.service.js';
import {
  ClaimSlotHandler,
  CountPatientAppointmentsOnDayHandler,
  CreateAppointmentHandler,
  CreateSlotsHandler,
  DecideRequestHandler,
  DeleteAppointmentHandler,
  DeleteSlotHandler,
  FindAppointmentHandler,
  FindSlotHandler,
  ListAppointmentsHandler,
  ListDoctorSlotsHandler,
  ReleaseSlotHandler,
  RequestCancelHandler,
  RequestRescheduleHandler,
  WithdrawRequestHandler,
} from './cqrs/handler/index.js';
import { AppointmentListener } from './event/index.js';
import { APPOINTMENT_QUEUE, AppointmentProcessor } from './queue/index.js';

@Module({
  imports: [DatabaseModule, ServiceModule, BullModule.registerQueue({ name: APPOINTMENT_QUEUE })],
  controllers: [AppointmentController],
  providers: [
    AppointmentService,
    AppointmentListener,
    AppointmentProcessor,
    ListDoctorSlotsHandler,
    FindSlotHandler,
    FindAppointmentHandler,
    ListAppointmentsHandler,
    CountPatientAppointmentsOnDayHandler,
    CreateSlotsHandler,
    DeleteSlotHandler,
    ClaimSlotHandler,
    ReleaseSlotHandler,
    CreateAppointmentHandler,
    DeleteAppointmentHandler,
    RequestCancelHandler,
    RequestRescheduleHandler,
    WithdrawRequestHandler,
    DecideRequestHandler,
  ],
})
export class AppointmentModule {}
