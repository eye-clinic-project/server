import type { Types } from 'mongoose';

import type { ReportStatus } from '../../../dependencies/enum/index.js';
import type { UserRefEntity } from './analysis.type.js';

export class ReportEntity {
  constructor(
    public readonly _id: Types.ObjectId,
    public readonly doctor: UserRefEntity,
    public readonly patient: UserRefEntity,
    public readonly analysis: Types.ObjectId,
    public readonly review: Types.ObjectId | null,
    public readonly title: string,
    public readonly content: string | null,
    public readonly recommendations: string | null,
    public readonly status: ReportStatus,
    public readonly sentAt: Date | null,
    public readonly viewedAt: Date | null,
    public readonly hasPdf: boolean,
    public readonly pdfSize: number | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
