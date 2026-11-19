import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import { CountUnreadQuery } from '../query/index.js';
import { MessageRepository } from '../../../../database/repository/index.js';

@QueryHandler(CountUnreadQuery)
export class CountUnreadHandler implements IQueryHandler<CountUnreadQuery> {
  constructor(private readonly messageRepository: MessageRepository) {}

  async execute({ userId, conversationIds }: CountUnreadQuery): Promise<Map<string, number>> {
    if (!conversationIds.length) return new Map();
    const rows = await this.messageRepository.aggregate<{ _id: Types.ObjectId; count: number }>({
      pipeline: [
        { $match: { conversation: { $in: conversationIds }, sender: { $ne: userId }, readBy: { $ne: userId }, deletedAt: null } },
        { $group: { _id: '$conversation', count: { $sum: 1 } } },
      ],
    });
    return new Map(rows.map((row) => [row._id.toString(), row.count]));
  }
}
