import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

export class DeleteNotificationCommand extends Command<boolean> {
  constructor(
    public readonly recipient: Types.ObjectId,
    public readonly notificationId: Types.ObjectId,
  ) {
    super();
  }
}
