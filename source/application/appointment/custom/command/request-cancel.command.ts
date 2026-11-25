import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

export class RequestCancelCommand extends Command<boolean> {
  constructor(
    public readonly appointmentId: Types.ObjectId,
    public readonly patientId: Types.ObjectId,
    public readonly reason: string,
  ) {
    super();
  }
}
