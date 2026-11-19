import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { ReviewView } from '../../entity/index.js';
import { FindReviewQuery } from '../query/index.js';
import { DoctorReviewRepository } from '../../../../database/repository/index.js';

@QueryHandler(FindReviewQuery)
export class FindReviewHandler implements IQueryHandler<FindReviewQuery> {
  constructor(private readonly doctorReviewRepository: DoctorReviewRepository) {}

  execute({ analysisId, doctorId }: FindReviewQuery): Promise<ReviewView | null> {
    return this.doctorReviewRepository.findOne({ filter: { analysis: analysisId, doctor: doctorId }, options: { lean: true } });
  }
}
