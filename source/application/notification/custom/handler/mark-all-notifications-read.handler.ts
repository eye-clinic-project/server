import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { MarkAllNotificationsReadCommand } from '../command/mark-all-notifications-read.command.js';
import { NotificationRepository } from '../../../../database/repository/notification.repository.js';

@CommandHandler(MarkAllNotificationsReadCommand)
export class MarkAllNotificationsReadHandler implements ICommandHandler<MarkAllNotificationsReadCommand> {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute({ recipient }: MarkAllNotificationsReadCommand): Promise<number> {
    const { modifiedCount } = await this.notificationRepository.updateMany({
      filter: { recipient, read: false },
      update: { $set: { read: true, readAt: new Date() } },
    });
    return modifiedCount;
  }
}
