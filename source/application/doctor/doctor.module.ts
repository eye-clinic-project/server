import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule } from '../../dependencies/module/database.module.js';
import { ServiceModule } from '../../dependencies/module/service.module.js';
import { AssignPatientHandler } from './cqrs/handler/assign-patient.handler.js';
import { FindAdminIdsHandler } from './cqrs/handler/find-admin-ids.handler.js';
import { GetDoctorProfileHandler } from './cqrs/handler/get-doctor-profile.handler.js';
import { SearchPatientsForAssignmentHandler } from './cqrs/handler/search-patients-for-assignment.handler.js';
import { SubmitLicenseHandler } from './cqrs/handler/submit-license.handler.js';
import { UnassignPatientHandler } from './cqrs/handler/unassign-patient.handler.js';
import { UpsertClinicHandler } from './cqrs/handler/upsert-clinic.handler.js';
import { DoctorListener } from './event/doctor.listener.js';
import { DOCTOR_QUEUE, DoctorProcessor } from './queue/doctor.queue.js';
import { DoctorController } from './doctor.controller.js';
import { DoctorService } from './doctor.service.js';

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
export class DoctorModule {}
