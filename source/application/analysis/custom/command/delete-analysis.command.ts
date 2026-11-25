import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

export class DeleteAnalysisCommand extends Command<string[]> {
  constructor(public readonly analysisId: Types.ObjectId) {
    super();
  }
}
