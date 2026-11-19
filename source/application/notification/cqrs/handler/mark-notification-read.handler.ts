import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { NotificationView } from '../../entity/index.js';
import { MarkNotificationReadCommand } from '../command/index.js';
import { NotificationRepository } from '../../../../database/repository/index.js';

@CommandHandler(MarkNotificationReadCommand)
export class MarkNotificationReadHandler implements ICommandHandler<MarkNotificationReadCommand> {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute({ recipient, notificationId }: MarkNotificationReadCommand): Promise<NotificationView | null> {
    const updated = await this.notificationRepository.findOneAndUpdate({
      filter: { _id: notificationId, recipient, read: false },
      update: { $set: { read: true, readAt: new Date() } },
      options: { lean: true },
    });
    return updated ?? this.notificationRepository.findOne({ filter: { _id: notificationId, recipient }, options: { lean: true } });
  }
}
