import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

export class MarkReadCommand extends Command<number> {
  constructor(
    public readonly conversationId: Types.ObjectId,
    public readonly readerId: Types.ObjectId,
    public readonly upTo?: Date,
  ) {
    super();
  }
}
