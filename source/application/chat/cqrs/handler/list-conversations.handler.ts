import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { ConversationView } from '../../entity/index.js';
import { ListConversationsQuery } from '../query/index.js';
import { ConversationRepository } from '../../../../database/repository/index.js';
import { populateConversation } from './chat.helper.js';

@QueryHandler(ListConversationsQuery)
export class ListConversationsHandler implements IQueryHandler<ListConversationsQuery> {
  constructor(private readonly conversationRepository: ConversationRepository) {}

  execute({ userId }: ListConversationsQuery): Promise<ConversationView[]> {
    return this.conversationRepository.find({
      filter: { participants: userId },
      options: { lean: true, populate: populateConversation, sort: { lastMessageAt: -1, updatedAt: -1 }, limit: 200 },
    });
  }
}
