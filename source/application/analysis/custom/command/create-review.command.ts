import { Command } from '@nestjs/cqrs';
import type { AnalysisView, ReviewView } from '../../type/analysis.type.js';
import type { ReviewData } from '../../type/analysis.type.js';

export class CreateReviewCommand extends Command<ReviewView> {
  constructor(
    public readonly analysis: AnalysisView,
    public readonly data: Required<Pick<ReviewData, 'aiResultConfirmed' | 'confirmedLevel'>> & ReviewData,
  ) {
    super();
  }
}
