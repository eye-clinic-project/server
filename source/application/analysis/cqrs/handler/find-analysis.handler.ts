import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { AnalysisView } from '../../entity/index.js';
import { FindAnalysisQuery } from '../query/index.js';
import { ANALYSIS_POPULATE } from './analysis.helper.js';
import { AnalysisRepository } from '../../../../database/repository/index.js';

@QueryHandler(FindAnalysisQuery)
export class FindAnalysisHandler implements IQueryHandler<FindAnalysisQuery> {
  constructor(private readonly analysisRepository: AnalysisRepository) {}

  execute({ analysisId }: FindAnalysisQuery): Promise<AnalysisView | null> {
    return this.analysisRepository.findById({ _id: analysisId, projection: '+gradCamKey', options: { lean: true, populate: ANALYSIS_POPULATE } });
  }
}
