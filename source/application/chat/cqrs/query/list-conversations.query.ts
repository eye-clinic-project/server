import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { ConversationView } from '../../entity/index.js';

export class ListConversationsQuery extends Query<ConversationView[]> {
  constructor(public readonly userId: Types.ObjectId) {
    super();
  }
}
