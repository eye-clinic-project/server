import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { MessageView } from '../../type/chat.type.js';

export class FindMessageQuery extends Query<MessageView | null> {
  constructor(public readonly messageId: Types.ObjectId) {
    super();
  }
}
