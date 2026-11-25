import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { AnalysisView } from '../../type/analysis.type.js';
import { ClaimAnalysisCommand } from '../command/claim-analysis.command.js';
import { ANALYSIS_POPULATE } from '../../type/analysis.type.js';
import { AnalysisRepository } from '../../../../database/repository/analysis.repository.js';
import { AnalysisStatus } from '../../../../dependencies/enum/database.enum.js';

@CommandHandler(ClaimAnalysisCommand)
export class ClaimAnalysisHandler implements ICommandHandler<ClaimAnalysisCommand> {
  constructor(private readonly analysisRepository: AnalysisRepository) {}

  async execute({ analysisId }: ClaimAnalysisCommand): Promise<AnalysisView | null> {
    const claimed = await this.analysisRepository.findOneAndUpdate({
      filter: { _id: analysisId, status: AnalysisStatus.PENDING },
      update: {
        $set: { status: AnalysisStatus.PROCESSING, error: null },
        $inc: { attempts: 1 },
        $push: { history: { status: AnalysisStatus.PROCESSING, message: 'Sent to AI service', at: new Date() } },
      },
    });
    if (!claimed) return null;
    return this.analysisRepository.findById({ _id: analysisId, options: { lean: true, populate: ANALYSIS_POPULATE } });
  }
}
