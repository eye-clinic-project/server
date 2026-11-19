import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { MessageView } from '../../entity/index.js';

export class FindMessageQuery extends Query<MessageView | null> {
  constructor(public readonly messageId: Types.ObjectId) {
    super();
  }
}
