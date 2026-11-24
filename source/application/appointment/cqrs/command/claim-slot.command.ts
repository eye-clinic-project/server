import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { SlotView } from '../../entity/appointment.type.js';

export class ClaimSlotCommand extends Command<SlotView | null> {
  constructor(
    public readonly slotId: Types.ObjectId,
    public readonly doctorId: Types.ObjectId,
  ) {
    super();
  }
}
