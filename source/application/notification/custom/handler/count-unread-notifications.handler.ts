import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CountUnreadNotificationsQuery } from '../query/count-unread-notifications.query.js';
import { NotificationRepository } from '../../../../database/repository/notification.repository.js';

@QueryHandler(CountUnreadNotificationsQuery)
export class CountUnreadNotificationsHandler implements IQueryHandler<CountUnreadNotificationsQuery> {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute({ recipient }: CountUnreadNotificationsQuery): Promise<number> {
    const [row] = await this.notificationRepository.aggregate<{ count: number }>({ pipeline: [{ $match: { recipient, read: false } }, { $count: 'count' }] });
    return row?.count ?? 0;
  }
}
