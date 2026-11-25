import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { ReviewView } from '../../type/analysis.type.js';
import { FindReviewQuery } from '../query/find-review.query.js';
import { DoctorReviewRepository } from '../../../../database/repository/doctor-review.repository.js';

@QueryHandler(FindReviewQuery)
export class FindReviewHandler implements IQueryHandler<FindReviewQuery> {
  constructor(private readonly doctorReviewRepository: DoctorReviewRepository) {}

  execute({ analysisId, doctorId }: FindReviewQuery): Promise<ReviewView | null> {
    return this.doctorReviewRepository.findOne({ filter: { analysis: analysisId, doctor: doctorId }, options: { lean: true } });
  }
}
