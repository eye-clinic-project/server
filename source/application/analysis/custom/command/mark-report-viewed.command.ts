import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

export class MarkReportViewedCommand extends Command<void> {
  constructor(public readonly reportId: Types.ObjectId) {
    super();
  }
}
