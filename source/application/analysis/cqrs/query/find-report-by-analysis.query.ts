import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { ReportView } from '../../entity/index.js';

export class FindReportByAnalysisQuery extends Query<ReportView | null> {
  constructor(public readonly analysisId: Types.ObjectId) {
    super();
  }
}
