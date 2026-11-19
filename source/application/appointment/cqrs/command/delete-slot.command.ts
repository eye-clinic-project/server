import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

export type DeleteSlotResult = 'deleted' | 'notFound' | 'notOwner' | 'booked';

export class DeleteSlotCommand extends Command<DeleteSlotResult> {
  constructor(
    public readonly doctorId: Types.ObjectId,
    public readonly slotId: Types.ObjectId,
  ) {
    super();
  }
}
