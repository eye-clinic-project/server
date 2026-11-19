import type { Types } from 'mongoose';
import { Query } from '@nestjs/cqrs';
import type { Page, ReportView } from '../../entity/index.js';
import type { ReportStatus } from '../../../../dependencies/enum/index.js';

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
