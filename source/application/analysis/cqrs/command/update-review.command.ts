import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

import type { ReviewData } from './analysis.type.js';
import type { ReviewView } from '../../entity/index.js';

export class UpdateReviewCommand extends Command<ReviewView | null> {
  constructor(
    public readonly reviewId: Types.ObjectId,
    public readonly data: ReviewData,
  ) {
    super();
  }
}
