import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { MessageView } from '../../type/chat.type.js';

export class ListMessagesQuery extends Query<MessageView[]> {
  constructor(
    public readonly conversationId: Types.ObjectId,
    public readonly limit: number,
    public readonly before?: Date,
  ) {
    super();
  }
}
