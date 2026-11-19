import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { AnalysisView } from '../../entity/index.js';
import type { ReportData } from './analysis.type.js';

export class CreateReportCommand extends Command<Types.ObjectId> {
  constructor(
    public readonly analysis: AnalysisView,
    public readonly reviewId: Types.ObjectId,
    public readonly data: Required<Pick<ReportData, 'title'>> & ReportData,
  ) {
    super();
  }
}
