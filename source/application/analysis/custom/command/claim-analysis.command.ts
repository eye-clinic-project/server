import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { AnalysisView } from '../../type/analysis.type.js';

export class ClaimAnalysisCommand extends Command<AnalysisView | null> {
  constructor(public readonly analysisId: Types.ObjectId) {
    super();
  }
}
