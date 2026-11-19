import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { NotificationView } from '../../entity/index.js';

export class ListNotificationsQuery extends Query<{ docs: NotificationView[]; count: number; currentPage: number; size: number; pages: number }> {
  constructor(
    public readonly recipient: Types.ObjectId,
    public readonly page: number,
    public readonly size: number,
    public readonly unread?: boolean,
  ) {
    super();
  }
}
