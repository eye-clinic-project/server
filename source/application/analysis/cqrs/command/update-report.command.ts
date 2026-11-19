import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

import type { ReportData } from './analysis.type.js';

export class UpdateReportCommand extends Command<boolean> {
  constructor(
    public readonly reportId: Types.ObjectId,
    public readonly data: ReportData,
  ) {
    super();
  }
}
