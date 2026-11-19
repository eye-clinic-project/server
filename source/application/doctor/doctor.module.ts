import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule, ServiceModule } from '../../dependencies/module/index.js';
import {
  AssignPatientHandler,
  FindAdminIdsHandler,
  GetDoctorProfileHandler,
  SearchPatientsForAssignmentHandler,
  SubmitLicenseHandler,
  UnassignPatientHandler,
  UpsertClinicHandler,
} from './cqrs/handler/index.js';
import { DoctorListener } from './event/index.js';
import { DOCTOR_QUEUE, DoctorProcessor } from './queue/index.js';
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
