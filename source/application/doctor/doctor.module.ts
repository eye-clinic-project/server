import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule } from '../../dependencies/module/database.module.js';
import { ServiceModule } from '../../dependencies/module/service.module.js';
import { AssignPatientHandler } from './custom/handler/assign-patient.handler.js';
import { FindAdminIdsHandler } from './custom/handler/find-admin-ids.handler.js';
import { GetDoctorProfileHandler } from './custom/handler/get-doctor-profile.handler.js';
import { SearchPatientsForAssignmentHandler } from './custom/handler/search-patients-for-assignment.handler.js';
import { SubmitLicenseHandler } from './custom/handler/submit-license.handler.js';
import { UnassignPatientHandler } from './custom/handler/unassign-patient.handler.js';
import { UpsertClinicHandler } from './custom/handler/upsert-clinic.handler.js';
import { DoctorListener } from './event/doctor.listener.js';
import { DOCTOR_QUEUE, DoctorProcessor } from './queue/doctor.queue.js';
import { DoctorController } from './doctor.controller.js';
import { DoctorService } from './doctor.service.js';
import { DoctorMiddleware } from './middleware/doctor.middleware.js';

@Module({
  imports: [DatabaseModule, ServiceModule, BullModule.registerQueue({ name: DOCTOR_QUEUE })],
  controllers: [DoctorController],
  providers: [
    DoctorService,
    DoctorListener,
    DoctorProcessor,
    GetDoctorProfileHandler,
    FindAdminIdsHandler,
    SearchPatientsForAssignmentHandler,
    UpsertClinicHandler,
    SubmitLicenseHandler,
    AssignPatientHandler,
    UnassignPatientHandler,
  ],
})
export class DoctorModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(DoctorMiddleware).forRoutes(DoctorController);
  }
}
