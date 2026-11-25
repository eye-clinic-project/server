import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule } from '../../dependencies/module/database.module.js';
import { ServiceModule } from '../../dependencies/module/service.module.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { DecideDoctorHandler } from './custom/handler/decide-doctor.handler.js';
import { EnsureAdminHandler } from './custom/handler/ensure-admin.handler.js';
import { FindDoctorHandler } from './custom/handler/find-doctor.handler.js';
import { ListDoctorsHandler } from './custom/handler/list-doctors.handler.js';
import { SetUserActiveHandler } from './custom/handler/set-user-active.handler.js';
import { AdminListener } from './event/admin.listener.js';
import { ADMIN_QUEUE, AdminProcessor } from './queue/admin.queue.js';
import { AdminMiddleware } from './middleware/admin.middleware.js';

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
export class AdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AdminMiddleware).forRoutes(AdminController);
  }
}
