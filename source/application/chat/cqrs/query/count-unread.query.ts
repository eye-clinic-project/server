import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

export class CountUnreadQuery extends Query<Map<string, number>> {
  constructor(
    public readonly userId: Types.ObjectId,
    public readonly conversationIds: Types.ObjectId[],
  ) {
    super();
  }
}
