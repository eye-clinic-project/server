import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { ReportView } from '../../entity/analysis.type.js';

export class DeleteReportCommand extends Command<ReportView | null> {
  constructor(public readonly reportId: Types.ObjectId) {
    super();
  }
}
