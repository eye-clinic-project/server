import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule } from '../../dependencies/module/database.module.js';
import { ServiceModule } from '../../dependencies/module/service.module.js';
import { AppointmentController } from './appointment.controller.js';
import { AppointmentService } from './appointment.service.js';
import { ClaimSlotHandler } from './custom/handler/claim-slot.handler.js';
import { CountPatientAppointmentsOnDayHandler } from './custom/handler/count-patient-appointments-on-day.handler.js';
import { CreateAppointmentHandler } from './custom/handler/create-appointment.handler.js';
import { CreateSlotsHandler } from './custom/handler/create-slots.handler.js';
import { DecideRequestHandler } from './custom/handler/decide-request.handler.js';
import { DeleteAppointmentHandler } from './custom/handler/delete-appointment.handler.js';
import { DeleteSlotHandler } from './custom/handler/delete-slot.handler.js';
import { FindAppointmentHandler } from './custom/handler/find-appointment.handler.js';
import { FindSlotHandler } from './custom/handler/find-slot.handler.js';
import { ListAppointmentsHandler } from './custom/handler/list-appointments.handler.js';
import { ListDoctorSlotsHandler } from './custom/handler/list-doctor-slots.handler.js';
import { ReleaseSlotHandler } from './custom/handler/release-slot.handler.js';
import { RequestCancelHandler } from './custom/handler/request-cancel.handler.js';
import { RequestRescheduleHandler } from './custom/handler/request-reschedule.handler.js';
import { WithdrawRequestHandler } from './custom/handler/withdraw-request.handler.js';
import { AppointmentListener } from './event/appointment.listener.js';
import { APPOINTMENT_QUEUE, AppointmentProcessor } from './queue/appointment.queue.js';
import { AppointmentMiddleware } from './middleware/appointment.middleware.js';

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
export class AppointmentModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppointmentMiddleware).forRoutes(AppointmentController);
  }
}
