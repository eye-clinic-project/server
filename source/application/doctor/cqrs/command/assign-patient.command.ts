import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

export class AssignPatientCommand extends Command<{ created: boolean }> {
  constructor(
    public readonly doctorId: Types.ObjectId,
    public readonly patientUserId: Types.ObjectId,
  ) {
    super();
  }
}
