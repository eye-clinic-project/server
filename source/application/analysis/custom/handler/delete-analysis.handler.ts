import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { Types } from 'mongoose';

import type { IAnalysis } from '../../../../dependencies/interface/database.interface.js';
import { AnalysisRepository } from '../../../../database/repository/analysis.repository.js';
import { DoctorReviewRepository } from '../../../../database/repository/doctor-review.repository.js';
import { FundusImageRepository } from '../../../../database/repository/fundus-image.repository.js';
import { DeleteAnalysisCommand } from '../command/delete-analysis.command.js';

@CommandHandler(DeleteAnalysisCommand)
export class DeleteAnalysisHandler implements ICommandHandler<DeleteAnalysisCommand> {
  constructor(
    private readonly analysisRepository: AnalysisRepository,
    private readonly fundusImageRepository: FundusImageRepository,
    private readonly doctorReviewRepository: DoctorReviewRepository,
  ) {}

  async execute({ analysisId }: DeleteAnalysisCommand): Promise<string[]> {
    const analysis: (IAnalysis & { _id: Types.ObjectId }) | null = await this.analysisRepository.findById({
      _id: analysisId,
      projection: '+gradCamKey',
      options: { lean: true },
    });
    if (!analysis) return [];
    await this.analysisRepository.deleteOne({ filter: { _id: analysisId } });
    await this.doctorReviewRepository.deleteMany({ filter: { analysis: analysisId } });

    const keys = analysis.gradCamKey ? [analysis.gradCamKey] : [];
    const stillUsed = await this.analysisRepository.findOne({ filter: { image: analysis.image }, projection: { _id: 1 }, options: { lean: true } });
    if (!stillUsed) {
      const image: { storageKey?: string } | null = await this.fundusImageRepository.findById({
        _id: analysis.image,
        projection: '+storageKey',
        options: { lean: true },
      });
      await this.fundusImageRepository.deleteOne({ filter: { _id: analysis.image } });
      if (image?.storageKey) keys.push(image.storageKey);
    }
    return keys;
  }
}
