import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { ConversationView } from '../../entity/chat.type.js';

export class FindConversationQuery extends Query<ConversationView | null> {
  constructor(public readonly conversationId: Types.ObjectId) {
    super();
  }
}
