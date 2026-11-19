import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { SlotView } from '../../entity/index.js';

export class CreateAppointmentCommand extends Command<Types.ObjectId> {
  constructor(
    public readonly patientId: Types.ObjectId,
    public readonly slot: SlotView,
    public readonly reason?: string,
  ) {
    super();
  }
}
