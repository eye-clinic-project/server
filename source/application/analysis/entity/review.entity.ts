import type { Types } from 'mongoose';

import { type DRLevel, DR_LEVEL_LABELS } from '../../../dependencies/enum/database.enum.js';
import type { ReviewView } from '../type/analysis.type.js';

export class ReviewEntity {
  constructor(
    public readonly _id: Types.ObjectId,
    public readonly analysis: Types.ObjectId,
    public readonly doctor: Types.ObjectId,
    public readonly patient: Types.ObjectId,
    public readonly aiResultConfirmed: boolean,
    public readonly confirmedLevel: DRLevel,
    public readonly confirmedLabel: string,
    public readonly notes: string | null,
    public readonly recommendations: string | null,
    public readonly followUpDate: Date | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}

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
