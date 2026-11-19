import { Command } from '@nestjs/cqrs';
import type { AnalysisView, ReviewView } from '../../entity/index.js';
import type { ReviewData } from './analysis.type.js';

export class CreateReviewCommand extends Command<ReviewView> {
  constructor(
    public readonly analysis: AnalysisView,
    public readonly data: Required<Pick<ReviewData, 'aiResultConfirmed' | 'confirmedLevel'>> & ReviewData,
  ) {
    super();
  }
}
