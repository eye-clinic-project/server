import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { ConversationView } from '../../entity/chat.type.js';
import { FindConversationQuery } from '../query/find-conversation.query.js';
import { ConversationRepository } from '../../../../database/repository/conversation.repository.js';
import { populateConversation } from './chat.helper.js';

@QueryHandler(FindConversationQuery)
export class FindConversationHandler implements IQueryHandler<FindConversationQuery> {
  constructor(private readonly conversationRepository: ConversationRepository) {}

  execute({ conversationId }: FindConversationQuery): Promise<ConversationView | null> {
    return this.conversationRepository.findById({ _id: conversationId, options: { lean: true, populate: populateConversation } });
  }
}
