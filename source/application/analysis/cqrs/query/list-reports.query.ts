import type { Types } from 'mongoose';
import { Query } from '@nestjs/cqrs';
import type { Page, ReportView } from '../../entity/analysis.type.js';
import type { ReportStatus } from '../../../../dependencies/enum/database.enum.js';

export interface ReportFilter {
  doctorId?: Types.ObjectId;
  patientUserId?: Types.ObjectId;
  status?: ReportStatus;
}

export class ListReportsQuery extends Query<Page<ReportView>> {
  constructor(
    public readonly filter: ReportFilter,
    public readonly page: number,
    public readonly size: number,
  ) {
    super();
  }
}
