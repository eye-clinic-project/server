import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { ReportView } from '../../entity/analysis.type.js';
import { FindReportByAnalysisQuery } from '../query/find-report-by-analysis.query.js';
import { REPORT_POPULATE } from './analysis.helper.js';
import { ReportRepository } from '../../../../database/repository/report.repository.js';

@QueryHandler(FindReportByAnalysisQuery)
export class FindReportByAnalysisHandler implements IQueryHandler<FindReportByAnalysisQuery> {
  constructor(private readonly reportRepository: ReportRepository) {}

  execute({ analysisId }: FindReportByAnalysisQuery): Promise<ReportView | null> {
    return this.reportRepository.findOne({ filter: { analysis: analysisId }, projection: '+pdfKey', options: { lean: true, populate: REPORT_POPULATE } });
  }
}
