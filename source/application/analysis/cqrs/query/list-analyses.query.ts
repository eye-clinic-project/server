import type { Types } from 'mongoose';
import { Query } from '@nestjs/cqrs';

import type { AnalysisStatus } from '../../../../dependencies/enum/index.js';
import type { AnalysisView, Page } from '../../entity/index.js';

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
