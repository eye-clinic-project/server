import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

export class EnsurePatientRecordCommand extends Command<Types.ObjectId> {
  constructor(public readonly userId: Types.ObjectId) {
    super();
  }
}
