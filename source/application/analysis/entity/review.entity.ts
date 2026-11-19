import type { Types } from 'mongoose';

import type { DRLevel } from '../../../dependencies/enum/index.js';

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
