import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { DeleteNotificationCommand } from '../command/index.js';
import { NotificationRepository } from '../../../../database/repository/index.js';

@CommandHandler(DeleteNotificationCommand)
export class DeleteNotificationHandler implements ICommandHandler<DeleteNotificationCommand> {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute({ recipient, notificationId }: DeleteNotificationCommand): Promise<boolean> {
    const { deletedCount } = await this.notificationRepository.deleteOne({ filter: { _id: notificationId, recipient } });
    return deletedCount > 0;
  }
}
