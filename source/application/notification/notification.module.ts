import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../dependencies/module/database.module.js';
import { CountUnreadNotificationsHandler } from './cqrs/handler/count-unread-notifications.handler.js';
import { DeleteNotificationHandler } from './cqrs/handler/delete-notification.handler.js';
import { ListNotificationsHandler } from './cqrs/handler/list-notifications.handler.js';
import { MarkAllNotificationsReadHandler } from './cqrs/handler/mark-all-notifications-read.handler.js';
import { MarkNotificationReadHandler } from './cqrs/handler/mark-notification-read.handler.js';
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
