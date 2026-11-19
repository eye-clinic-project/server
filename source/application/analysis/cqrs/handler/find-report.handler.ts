import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { ReportView } from '../../entity/index.js';
import { FindReportQuery } from '../query/index.js';
import { REPORT_POPULATE } from './analysis.helper.js';
import { ReportRepository } from '../../../../database/repository/index.js';

@QueryHandler(FindReportQuery)
export class FindReportHandler implements IQueryHandler<FindReportQuery> {
  constructor(private readonly reportRepository: ReportRepository) {}

  execute({ reportId }: FindReportQuery): Promise<ReportView | null> {
    return this.reportRepository.findById({ _id: reportId, projection: '+pdfKey', options: { lean: true, populate: REPORT_POPULATE } });
  }
}
