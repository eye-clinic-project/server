import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { ReportView } from '../../entity/index.js';
import { FindReportByAnalysisQuery } from '../query/index.js';
import { REPORT_POPULATE } from './analysis.helper.js';
import { ReportRepository } from '../../../../database/repository/index.js';

@QueryHandler(FindReportByAnalysisQuery)
export class FindReportByAnalysisHandler implements IQueryHandler<FindReportByAnalysisQuery> {
  constructor(private readonly reportRepository: ReportRepository) {}

  execute({ analysisId }: FindReportByAnalysisQuery): Promise<ReportView | null> {
    return this.reportRepository.findOne({ filter: { analysis: analysisId }, projection: '+pdfKey', options: { lean: true, populate: REPORT_POPULATE } });
  }
}
