import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule } from '../../dependencies/module/database.module.js';
import { ServiceModule } from '../../dependencies/module/service.module.js';
import { AppointmentController } from './appointment.controller.js';
import { AppointmentService } from './appointment.service.js';
import { ClaimSlotHandler } from './cqrs/handler/claim-slot.handler.js';
import { CountPatientAppointmentsOnDayHandler } from './cqrs/handler/count-patient-appointments-on-day.handler.js';
import { CreateAppointmentHandler } from './cqrs/handler/create-appointment.handler.js';
import { CreateSlotsHandler } from './cqrs/handler/create-slots.handler.js';
import { DecideRequestHandler } from './cqrs/handler/decide-request.handler.js';
import { DeleteAppointmentHandler } from './cqrs/handler/delete-appointment.handler.js';
import { DeleteSlotHandler } from './cqrs/handler/delete-slot.handler.js';
import { FindAppointmentHandler } from './cqrs/handler/find-appointment.handler.js';
import { FindSlotHandler } from './cqrs/handler/find-slot.handler.js';
import { ListAppointmentsHandler } from './cqrs/handler/list-appointments.handler.js';
import { ListDoctorSlotsHandler } from './cqrs/handler/list-doctor-slots.handler.js';
import { ReleaseSlotHandler } from './cqrs/handler/release-slot.handler.js';
import { RequestCancelHandler } from './cqrs/handler/request-cancel.handler.js';
import { RequestRescheduleHandler } from './cqrs/handler/request-reschedule.handler.js';
import { WithdrawRequestHandler } from './cqrs/handler/withdraw-request.handler.js';
import { AppointmentListener } from './event/appointment.listener.js';
import { APPOINTMENT_QUEUE, AppointmentProcessor } from './queue/appointment.queue.js';

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
