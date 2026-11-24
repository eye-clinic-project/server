import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule } from '../../dependencies/module/database.module.js';
import { ServiceModule } from '../../dependencies/module/service.module.js';
import { BackfillPatientRecordsHandler } from './cqrs/handler/backfill-patient-records.handler.js';
import { CreatePatientHandler } from './cqrs/handler/create-patient.handler.js';
import { DeletePatientHandler } from './cqrs/handler/delete-patient.handler.js';
import { EnsurePatientRecordHandler } from './cqrs/handler/ensure-patient-record.handler.js';
import { FindPatientByIdHandler } from './cqrs/handler/find-patient-by-id.handler.js';
import { FindPatientByUserHandler } from './cqrs/handler/find-patient-by-user.handler.js';
import { IsPatientAssignedHandler } from './cqrs/handler/is-patient-assigned.handler.js';
import { ListAssignedDoctorsHandler } from './cqrs/handler/list-assigned-doctors.handler.js';
import { ListPatientsHandler } from './cqrs/handler/list-patients.handler.js';
import { UpdatePatientHandler } from './cqrs/handler/update-patient.handler.js';
import { PatientListener } from './event/patient.listener.js';
import { PATIENT_QUEUE, PatientProcessor } from './queue/patient.queue.js';
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
