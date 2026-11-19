import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { MessageView } from '../../entity/index.js';
import { FindMessageQuery } from '../query/index.js';
import { MessageRepository } from '../../../../database/repository/index.js';

@QueryHandler(FindMessageQuery)
export class FindMessageHandler implements IQueryHandler<FindMessageQuery> {
  constructor(private readonly messageRepository: MessageRepository) {}

  execute({ messageId }: FindMessageQuery): Promise<MessageView | null> {
    return this.messageRepository.findOne({ filter: { _id: messageId, deletedAt: null }, options: { lean: true } });
  }
}
