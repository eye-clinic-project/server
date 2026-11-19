import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { ReviewView } from '../../entity/index.js';

export class FindReviewQuery extends Query<ReviewView | null> {
  constructor(
    public readonly analysisId: Types.ObjectId,
    public readonly doctorId: Types.ObjectId,
  ) {
    super();
  }
}
