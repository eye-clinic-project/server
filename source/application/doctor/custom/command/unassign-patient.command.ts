import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

export class UnassignPatientCommand extends Command<boolean> {
  constructor(
    public readonly doctorId: Types.ObjectId,
    public readonly patientUserId: Types.ObjectId,
  ) {
    super();
  }
}
