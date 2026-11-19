import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { AnalysisView } from '../../entity/index.js';

export class ClaimAnalysisCommand extends Command<AnalysisView | null> {
  constructor(public readonly analysisId: Types.ObjectId) {
    super();
  }
}
