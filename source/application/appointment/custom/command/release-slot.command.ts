import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

export class ReleaseSlotCommand extends Command<void> {
  constructor(
    public readonly slotId: Types.ObjectId,
    public readonly appointmentId?: Types.ObjectId,
  ) {
    super();
  }
}
