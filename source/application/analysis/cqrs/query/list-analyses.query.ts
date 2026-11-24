import type { Types } from 'mongoose';
import { Query } from '@nestjs/cqrs';

import type { AnalysisStatus } from '../../../../dependencies/enum/database.enum.js';
import type { AnalysisView, Page } from '../../entity/analysis.type.js';

export interface AnalysisFilter {
  doctorId?: Types.ObjectId;
  patientUserId?: Types.ObjectId;
  status?: AnalysisStatus;
  hasDR?: boolean;
  reviewed?: boolean;
}

export class ListAnalysesQuery extends Query<Page<AnalysisView>> {
  constructor(
    public readonly filter: AnalysisFilter,
    public readonly page: number,
    public readonly size: number,
  ) {
    super();
  }
}
