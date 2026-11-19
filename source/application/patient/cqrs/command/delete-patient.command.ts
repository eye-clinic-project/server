import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

export class DeletePatientCommand extends Command<void> {
  constructor(
    public readonly patientId: Types.ObjectId,
    public readonly userId: Types.ObjectId,
  ) {
    super();
  }
}
