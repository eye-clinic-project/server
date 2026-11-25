import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { MessageView } from '../../type/chat.type.js';
import { CreateMessageCommand } from '../command/create-message.command.js';
import { ConversationRepository } from '../../../../database/repository/conversation.repository.js';
import { MessageRepository } from '../../../../database/repository/message.repository.js';

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
