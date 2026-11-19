import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule, ServiceModule } from '../../dependencies/module/index.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { DecideDoctorHandler, EnsureAdminHandler, FindDoctorHandler, ListDoctorsHandler, SetUserActiveHandler } from './cqrs/handler/index.js';
import { AdminListener } from './event/index.js';
import { ADMIN_QUEUE, AdminProcessor } from './queue/index.js';

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
