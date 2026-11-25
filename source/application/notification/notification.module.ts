import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../dependencies/module/database.module.js';
import { CountUnreadNotificationsHandler } from './custom/handler/count-unread-notifications.handler.js';
import { DeleteNotificationHandler } from './custom/handler/delete-notification.handler.js';
import { ListNotificationsHandler } from './custom/handler/list-notifications.handler.js';
import { MarkAllNotificationsReadHandler } from './custom/handler/mark-all-notifications-read.handler.js';
import { MarkNotificationReadHandler } from './custom/handler/mark-notification-read.handler.js';
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
