import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { ReviewView } from '../../entity/index.js';
import { UpdateReviewCommand } from '../command/index.js';
import { AnalysisRepository, DoctorReviewRepository } from '../../../../database/repository/index.js';

const defined = <T extends object>(data: T) => Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as Partial<T>;

@CommandHandler(UpdateReviewCommand)
export class UpdateReviewHandler implements ICommandHandler<UpdateReviewCommand> {
  constructor(
    private readonly doctorReviewRepository: DoctorReviewRepository,
    private readonly analysisRepository: AnalysisRepository,
  ) {}

  async execute({ reviewId, data }: UpdateReviewCommand): Promise<ReviewView | null> {
    const review: ReviewView | null = await this.doctorReviewRepository.findOneAndUpdate({
      filter: { _id: reviewId },
      update: { $set: defined(data) },
      options: { lean: true },
    });
    if (review) await this.analysisRepository.updateOne({ filter: { _id: review.analysis }, update: { $set: { reviewedAt: new Date() } } });
    return review;
  }
}
