import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

export class RetryAnalysisCommand extends Command<boolean> {
  constructor(
    public readonly analysisId: Types.ObjectId,
    public readonly by: Types.ObjectId,
  ) {
    super();
  }
}
