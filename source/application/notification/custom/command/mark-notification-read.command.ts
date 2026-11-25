import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { NotificationView } from '../../type/notification.type.js';

export class MarkNotificationReadCommand extends Command<NotificationView | null> {
  constructor(
    public readonly recipient: Types.ObjectId,
    public readonly notificationId: Types.ObjectId,
  ) {
    super();
  }
}
