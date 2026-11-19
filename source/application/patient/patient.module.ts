import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule, ServiceModule } from '../../dependencies/module/index.js';
import {
  BackfillPatientRecordsHandler,
  CreatePatientHandler,
  DeletePatientHandler,
  EnsurePatientRecordHandler,
  FindPatientByIdHandler,
  FindPatientByUserHandler,
  IsPatientAssignedHandler,
  ListAssignedDoctorsHandler,
  ListPatientsHandler,
  UpdatePatientHandler,
} from './cqrs/handler/index.js';
import { PatientListener } from './event/index.js';
import { PATIENT_QUEUE, PatientProcessor } from './queue/index.js';
import { PatientController } from './patient.controller.js';
import { PatientService } from './patient.service.js';

@Module({
  imports: [DatabaseModule, ServiceModule, BullModule.registerQueue({ name: PATIENT_QUEUE })],
  controllers: [PatientController],
  providers: [
    PatientService,
    PatientListener,
    PatientProcessor,
    FindPatientByIdHandler,
    FindPatientByUserHandler,
    ListPatientsHandler,
    ListAssignedDoctorsHandler,
    IsPatientAssignedHandler,
    CreatePatientHandler,
    UpdatePatientHandler,
    DeletePatientHandler,
    EnsurePatientRecordHandler,
    BackfillPatientRecordsHandler,
  ],
})
export class PatientModule {}
