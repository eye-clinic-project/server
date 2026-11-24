import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

import { ConversationRepository } from '../../../../database/repository/conversation.repository.js';
import { OpenConversationCommand } from '../command/open-conversation.command.js';

@CommandHandler(OpenConversationCommand)
export class OpenConversationHandler implements ICommandHandler<OpenConversationCommand> {
  constructor(private readonly conversationRepository: ConversationRepository) {}

  async execute({ doctorId, patientId }: OpenConversationCommand) {
    const existing = await this.conversationRepository.findOne({
      filter: { doctor: doctorId, patient: patientId },
      projection: { _id: 1 },
      options: { lean: true },
    });
    if (existing) return { conversationId: existing._id as Types.ObjectId, created: false };

    try {
      const created = await this.conversationRepository.create({ data: { doctor: doctorId, patient: patientId, participants: [doctorId, patientId] } });
      return { conversationId: created._id, created: true };
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      const raced = await this.conversationRepository.findOne({
        filter: { doctor: doctorId, patient: patientId },
        projection: { _id: 1 },
        options: { lean: true },
      });
      return { conversationId: raced._id as Types.ObjectId, created: false };
    }
  }
}
