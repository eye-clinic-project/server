import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { Types } from 'mongoose';

import { AnalysisRepository } from '../../../../database/repository/analysis.repository.js';
import { AnalysisStatus } from '../../../../dependencies/enum/database.enum.js';
import { RequeueAnalysesCommand } from '../command/requeue-analyses.command.js';

@CommandHandler(RequeueAnalysesCommand)
export class RequeueAnalysesHandler implements ICommandHandler<RequeueAnalysesCommand> {
  constructor(private readonly analysisRepository: AnalysisRepository) {}

  async execute(): Promise<Types.ObjectId[]> {
    await this.analysisRepository.updateMany({ filter: { status: AnalysisStatus.PROCESSING }, update: { $set: { status: AnalysisStatus.PENDING } } });
    const pending: { _id: Types.ObjectId }[] = await this.analysisRepository.find({
      filter: { status: AnalysisStatus.PENDING },
      projection: { _id: 1 },
      options: { lean: true, sort: { createdAt: 1 } },
    });
    return pending.map(({ _id }) => _id);
  }
}
