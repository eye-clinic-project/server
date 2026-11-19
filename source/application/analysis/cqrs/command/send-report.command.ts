import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

export class SendReportCommand extends Command<boolean> {
  constructor(public readonly reportId: Types.ObjectId) {
    super();
  }
}
