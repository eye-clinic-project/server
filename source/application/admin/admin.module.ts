import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule } from '../../dependencies/module/database.module.js';
import { ServiceModule } from '../../dependencies/module/service.module.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { DecideDoctorHandler } from './cqrs/handler/decide-doctor.handler.js';
import { EnsureAdminHandler } from './cqrs/handler/ensure-admin.handler.js';
import { FindDoctorHandler } from './cqrs/handler/find-doctor.handler.js';
import { ListDoctorsHandler } from './cqrs/handler/list-doctors.handler.js';
import { SetUserActiveHandler } from './cqrs/handler/set-user-active.handler.js';
import { AdminListener } from './event/admin.listener.js';
import { ADMIN_QUEUE, AdminProcessor } from './queue/admin.queue.js';

@Module({
  imports: [DatabaseModule, ServiceModule, BullModule.registerQueue({ name: ADMIN_QUEUE })],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminListener,
    AdminProcessor,
    ListDoctorsHandler,
    FindDoctorHandler,
    DecideDoctorHandler,
    SetUserActiveHandler,
    EnsureAdminHandler,
  ],
})
export class AdminModule {}
