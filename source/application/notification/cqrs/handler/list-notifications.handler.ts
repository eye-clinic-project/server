import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ListNotificationsQuery } from '../query/index.js';
import { NotificationRepository } from '../../../../database/repository/index.js';

@QueryHandler(ListNotificationsQuery)
export class ListNotificationsHandler implements IQueryHandler<ListNotificationsQuery> {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  execute({ recipient, page, size, unread }: ListNotificationsQuery) {
    return this.notificationRepository.paginate({
      filter: { recipient, ...(unread !== undefined && { read: !unread }) },
      options: { lean: true, sort: { createdAt: -1 } },
      page,
      size,
    });
  }
}
