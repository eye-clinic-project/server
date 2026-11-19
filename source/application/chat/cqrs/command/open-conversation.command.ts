import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

export class OpenConversationCommand extends Command<{ conversationId: Types.ObjectId; created: boolean }> {
  constructor(
    public readonly doctorId: Types.ObjectId,
    public readonly patientId: Types.ObjectId,
  ) {
    super();
  }
}
