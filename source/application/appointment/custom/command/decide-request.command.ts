import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { AppointmentView } from '../../type/appointment.type.js';

export class DecideRequestCommand extends Command<boolean> {
  constructor(
    public readonly appointment: AppointmentView,
    public readonly doctorId: Types.ObjectId,
    public readonly approve: boolean,
    public readonly note?: string,
  ) {
    super();
  }
}
