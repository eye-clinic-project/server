import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

export class MarkAllNotificationsReadCommand extends Command<number> {
  constructor(public readonly recipient: Types.ObjectId) {
    super();
  }
}
