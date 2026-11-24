import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

import type { RescheduleReason } from '../../../../dependencies/enum/database.enum.js';
import type { SlotView } from '../../entity/appointment.type.js';

export class RequestRescheduleCommand extends Command<boolean> {
  constructor(
    public readonly appointmentId: Types.ObjectId,
    public readonly patientId: Types.ObjectId,
    public readonly slot: SlotView,
    public readonly rescheduleReason: RescheduleReason,
    public readonly note?: string,
  ) {
    super();
  }
}
