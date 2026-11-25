import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { QueryFilter } from 'mongoose';
import type { AnalysisView, Page } from '../../type/analysis.type.js';
import { ListAnalysesQuery } from '../query/list-analyses.query.js';
import type { IAnalysis } from '../../../../dependencies/interface/database.interface.js';
import { ANALYSIS_POPULATE } from '../../type/analysis.type.js';
import { AnalysisRepository } from '../../../../database/repository/analysis.repository.js';

@QueryHandler(ListAnalysesQuery)
export class ListAnalysesHandler implements IQueryHandler<ListAnalysesQuery> {
  constructor(private readonly analysisRepository: AnalysisRepository) {}

  async execute({ filter: { doctorId, patientUserId, status, hasDR, reviewed }, page, size }: ListAnalysesQuery): Promise<Page<AnalysisView>> {
    const filter: QueryFilter<IAnalysis> = {
      ...(doctorId && { doctor: doctorId }),
      ...(patientUserId && { patient: patientUserId }),
      ...(status && { status }),
      ...(hasDR !== undefined && { hasDR }),
      ...(reviewed !== undefined && { reviewedAt: reviewed ? { $ne: null } : null }),
    };
    return this.analysisRepository.paginate({
      filter,
      projection: '+gradCamKey',
      options: { lean: true, sort: { createdAt: -1 }, populate: ANALYSIS_POPULATE },
      page,
      size,
    });
  }
}
