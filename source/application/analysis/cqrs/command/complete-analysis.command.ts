import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

import type { AiPrediction } from '../../ai.service.js';

export class CompleteAnalysisCommand extends Command<void> {
  constructor(
    public readonly analysisId: Types.ObjectId,
    public readonly prediction: AiPrediction,
    public readonly gradCamKey: string | null,
  ) {
    super();
  }
}
