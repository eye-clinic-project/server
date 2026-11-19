import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AnalysisRepository } from '../../../../database/repository/index.js';
import { AnalysisStatus } from '../../../../dependencies/enum/index.js';
import { RetryAnalysisCommand } from '../command/index.js';

@CommandHandler(RetryAnalysisCommand)
export class RetryAnalysisHandler implements ICommandHandler<RetryAnalysisCommand> {
  constructor(private readonly analysisRepository: AnalysisRepository) {}

  async execute({ analysisId, by }: RetryAnalysisCommand): Promise<boolean> {
    const result = await this.analysisRepository.updateOne({
      filter: { _id: analysisId, status: AnalysisStatus.FAILED },
      update: {
        $set: { status: AnalysisStatus.PENDING, error: null },
        $push: { history: { status: AnalysisStatus.PENDING, message: 'Analysis created', at: new Date(), by } },
      },
    });
    return result.modifiedCount > 0;
  }
}
