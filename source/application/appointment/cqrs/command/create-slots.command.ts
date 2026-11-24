import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { SlotView } from '../../entity/appointment.type.js';

export class CreateSlotsCommand extends Command<SlotView[]> {
  constructor(
    public readonly doctorId: Types.ObjectId,
    public readonly slots: { startAt: Date; endAt: Date }[],
  ) {
    super();
  }
}
