import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { ReviewView } from '../../entity/index.js';
import { CreateReviewCommand } from '../command/index.js';
import { AnalysisRepository, DoctorReviewRepository } from '../../../../database/repository/index.js';

const defined = <T extends object>(data: T) => Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as Partial<T>;

@CommandHandler(CreateReviewCommand)
export class CreateReviewHandler implements ICommandHandler<CreateReviewCommand> {
  constructor(
    private readonly doctorReviewRepository: DoctorReviewRepository,
    private readonly analysisRepository: AnalysisRepository,
  ) {}

  async execute({ analysis, data }: CreateReviewCommand): Promise<ReviewView> {
    const review = await this.doctorReviewRepository.create({
      data: { ...defined(data), analysis: analysis._id, doctor: analysis.doctor, patient: analysis.patient._id },
    });
    await this.analysisRepository.updateOne({ filter: { _id: analysis._id }, update: { $set: { reviewedAt: new Date() } } });
    return review.toObject() as ReviewView;
  }
}
