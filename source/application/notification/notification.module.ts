import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../dependencies/module/index.js';
import {
  CountUnreadNotificationsHandler,
  DeleteNotificationHandler,
  ListNotificationsHandler,
  MarkAllNotificationsReadHandler,
  MarkNotificationReadHandler,
} from './cqrs/handler/index.js';
import { NotificationController } from './notification.controller.js';
import { NotificationInboxService } from './notification.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [NotificationController],
  providers: [
    NotificationInboxService,
    ListNotificationsHandler,
    CountUnreadNotificationsHandler,
    MarkNotificationReadHandler,
    MarkAllNotificationsReadHandler,
    DeleteNotificationHandler,
  ],
})
export class NotificationModule {}
