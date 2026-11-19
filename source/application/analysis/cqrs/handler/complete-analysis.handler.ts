import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AnalysisRepository } from '../../../../database/repository/index.js';
import { AnalysisStatus } from '../../../../dependencies/enum/index.js';
import { CompleteAnalysisCommand } from '../command/index.js';

@CommandHandler(CompleteAnalysisCommand)
export class CompleteAnalysisHandler implements ICommandHandler<CompleteAnalysisCommand> {
  constructor(private readonly analysisRepository: AnalysisRepository) {}

  async execute({ analysisId, prediction, gradCamKey }: CompleteAnalysisCommand): Promise<void> {
    await this.analysisRepository.updateOne({
      filter: { _id: analysisId, status: AnalysisStatus.PROCESSING },
      update: {
        $set: {
          status: AnalysisStatus.COMPLETED,
          hasDR: prediction.hasDR,
          stage1Confidence: prediction.stage1Confidence,
          predictedLevel: prediction.predictedLevel,
          confidence: prediction.confidence,
          probabilities: prediction.probabilities,
          findings: prediction.findings,
          gradCamKey,
          modelVersion: prediction.modelVersion,
          isMock: prediction.isMock,
          processingMs: prediction.processingMs,
          error: null,
          completedAt: new Date(),
        },
        $push: { history: { status: AnalysisStatus.COMPLETED, message: `Completed by ${prediction.modelVersion}`, at: new Date() } },
      },
    });
  }
}
