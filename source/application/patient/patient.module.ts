import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule } from '../../dependencies/module/database.module.js';
import { ServiceModule } from '../../dependencies/module/service.module.js';
import { BackfillPatientRecordsHandler } from './custom/handler/backfill-patient-records.handler.js';
import { CreatePatientHandler } from './custom/handler/create-patient.handler.js';
import { DeletePatientHandler } from './custom/handler/delete-patient.handler.js';
import { EnsurePatientRecordHandler } from './custom/handler/ensure-patient-record.handler.js';
import { FindPatientByIdHandler } from './custom/handler/find-patient-by-id.handler.js';
import { FindPatientByUserHandler } from './custom/handler/find-patient-by-user.handler.js';
import { IsPatientAssignedHandler } from './custom/handler/is-patient-assigned.handler.js';
import { ListAssignedDoctorsHandler } from './custom/handler/list-assigned-doctors.handler.js';
import { ListPatientsHandler } from './custom/handler/list-patients.handler.js';
import { UpdatePatientHandler } from './custom/handler/update-patient.handler.js';
import { PatientListener } from './event/patient.listener.js';
import { PATIENT_QUEUE, PatientProcessor } from './queue/patient.queue.js';
import { PatientController } from './patient.controller.js';
import { PatientService } from './patient.service.js';
import { PatientMiddleware } from './middleware/patient.middleware.js';

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
export class PatientModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(PatientMiddleware).forRoutes(PatientController);
  }
}
