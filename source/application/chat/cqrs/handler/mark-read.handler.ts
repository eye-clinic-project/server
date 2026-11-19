import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { MarkReadCommand } from '../command/index.js';
import { MessageRepository } from '../../../../database/repository/index.js';

@CommandHandler(MarkReadCommand)
export class MarkReadHandler implements ICommandHandler<MarkReadCommand> {
  constructor(private readonly messageRepository: MessageRepository) {}

  async execute({ conversationId, readerId, upTo }: MarkReadCommand): Promise<number> {
    const { modifiedCount } = await this.messageRepository.updateMany({
      filter: { conversation: conversationId, sender: { $ne: readerId }, readBy: { $ne: readerId }, ...(upTo && { createdAt: { $lte: upTo } }) },
      update: { $addToSet: { readBy: readerId } },
    });
    return modifiedCount;
  }
}
