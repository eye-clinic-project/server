import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

export class CountUnreadNotificationsQuery extends Query<number> {
  constructor(public readonly recipient: Types.ObjectId) {
    super();
  }
}
