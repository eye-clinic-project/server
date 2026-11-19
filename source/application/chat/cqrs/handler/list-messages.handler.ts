import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { MessageView } from '../../entity/index.js';
import { ListMessagesQuery } from '../query/index.js';
import { MessageRepository } from '../../../../database/repository/index.js';

@QueryHandler(ListMessagesQuery)
export class ListMessagesHandler implements IQueryHandler<ListMessagesQuery> {
  constructor(private readonly messageRepository: MessageRepository) {}

  execute({ conversationId, limit, before }: ListMessagesQuery): Promise<MessageView[]> {
    return this.messageRepository.find({
      filter: { conversation: conversationId, deletedAt: null, ...(before && { createdAt: { $lt: before } }) },
      options: { lean: true, sort: { createdAt: -1 }, limit },
    });
  }
}
