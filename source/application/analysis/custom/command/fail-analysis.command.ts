import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

export class FailAnalysisCommand extends Command<void> {
  constructor(
    public readonly analysisId: Types.ObjectId,
    public readonly message: string,
  ) {
    super();
  }
}
