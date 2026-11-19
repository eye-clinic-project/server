import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

export class DeleteAppointmentCommand extends Command<void> {
  constructor(public readonly appointmentId: Types.ObjectId) {
    super();
  }
}
