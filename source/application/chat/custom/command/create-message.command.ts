import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { MessageView } from '../../type/chat.type.js';

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
