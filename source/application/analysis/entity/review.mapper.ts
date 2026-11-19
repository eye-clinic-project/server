import type { ReviewView } from './analysis.type.js';
import { DR_LEVEL_LABELS } from '../../../dependencies/enum/index.js';
import { ReviewEntity } from './review.entity.js';

export const toReviewEntity = (review: ReviewView): ReviewEntity =>
  new ReviewEntity(
    review._id,
    review.analysis,
    review.doctor,
    review.patient,
    review.aiResultConfirmed,
    review.confirmedLevel,
    DR_LEVEL_LABELS[review.confirmedLevel],
    review.notes ?? null,
    review.recommendations ?? null,
    review.followUpDate ?? null,
    review.createdAt,
    review.updatedAt,
  );
