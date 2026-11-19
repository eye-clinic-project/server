import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { MarkAllNotificationsReadCommand } from '../command/index.js';
import { NotificationRepository } from '../../../../database/repository/index.js';

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
