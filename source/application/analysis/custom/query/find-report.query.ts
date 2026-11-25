import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { ReportView } from '../../type/analysis.type.js';

export class FindReportQuery extends Query<ReportView | null> {
  constructor(public readonly reportId: Types.ObjectId) {
    super();
  }
}
