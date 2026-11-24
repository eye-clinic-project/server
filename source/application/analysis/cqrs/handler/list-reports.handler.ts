import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { QueryFilter } from 'mongoose';

import type { IReport } from '../../../../dependencies/interface/database.interface.js';
import type { Page, ReportView } from '../../entity/analysis.type.js';
import { ListReportsQuery } from '../query/list-reports.query.js';
import { REPORT_POPULATE } from './analysis.helper.js';
import { ReportRepository } from '../../../../database/repository/report.repository.js';

@QueryHandler(ListReportsQuery)
export class ListReportsHandler implements IQueryHandler<ListReportsQuery> {
  constructor(private readonly reportRepository: ReportRepository) {}

  execute({ filter: { doctorId, patientUserId, status }, page, size }: ListReportsQuery): Promise<Page<ReportView>> {
    const filter: QueryFilter<IReport> = {
      ...(doctorId && { doctor: doctorId }),
      ...(patientUserId && { patient: patientUserId }),
      ...(status && { status }),
    };
    return this.reportRepository.paginate({ filter, options: { lean: true, sort: { createdAt: -1 }, populate: REPORT_POPULATE }, page, size });
  }
}
