import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { MessageView } from '../../entity/index.js';
import { CreateMessageCommand } from '../command/index.js';
import { ConversationRepository, MessageRepository } from '../../../../database/repository/index.js';

@CommandHandler(CreateMessageCommand)
export class CreateMessageHandler implements ICommandHandler<CreateMessageCommand> {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly conversationRepository: ConversationRepository,
  ) {}

  async execute({ conversationId, senderId, message, attachments }: CreateMessageCommand): Promise<MessageView> {
    const created = await this.messageRepository.create({ data: { conversation: conversationId, sender: senderId, message, attachments, readBy: [senderId] } });
    await this.conversationRepository.updateOne({
      filter: { _id: conversationId },
      update: { $set: { lastMessage: created._id, lastMessageAt: created.get('createdAt') as Date } },
    });
    return created.toObject() as MessageView;
  }
}
