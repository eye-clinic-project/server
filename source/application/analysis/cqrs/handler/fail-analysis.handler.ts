import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AnalysisRepository } from '../../../../database/repository/index.js';
import { AnalysisStatus } from '../../../../dependencies/enum/index.js';
import { FailAnalysisCommand } from '../command/index.js';

@CommandHandler(FailAnalysisCommand)
export class FailAnalysisHandler implements ICommandHandler<FailAnalysisCommand> {
  constructor(private readonly analysisRepository: AnalysisRepository) {}

  async execute({ analysisId, message }: FailAnalysisCommand): Promise<void> {
    await this.analysisRepository.updateOne({
      filter: { _id: analysisId, status: AnalysisStatus.PROCESSING },
      update: {
        $set: { status: AnalysisStatus.FAILED, error: message },
        $push: { history: { status: AnalysisStatus.FAILED, message, at: new Date() } },
      },
    });
  }
}
