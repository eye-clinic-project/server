import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { AnalysisView } from '../../entity/analysis.type.js';

export class FindAnalysisQuery extends Query<AnalysisView | null> {
  constructor(public readonly analysisId: Types.ObjectId) {
    super();
  }
}
