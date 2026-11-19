import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { MessageView } from '../../entity/index.js';

export class CreateMessageCommand extends Command<MessageView> {
  constructor(
    public readonly conversationId: Types.ObjectId,
    public readonly senderId: Types.ObjectId,
    public readonly message: string,
    public readonly attachments: string[],
  ) {
    super();
  }
}
