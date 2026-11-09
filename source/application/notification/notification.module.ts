import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service.js';
import { NotificationGateway } from './notification.gateway.js';
import { NotificationController } from './notification.controller.js';

@Module({
  providers: [NotificationGateway, NotificationService],
  controllers: [NotificationController],
})
export class NotificationModule {}
