import type { Types } from 'mongoose';

import { ReportStatus } from '../../../dependencies/enum/database.enum.js';
import { toUserRefEntity, type UserRefEntity } from './user-ref.entity.js';
import type { ReportView } from './analysis.type.js';

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

export const toReportEntity = (report: ReportView): ReportEntity =>
  new ReportEntity(
    report._id,
    toUserRefEntity(report.doctor),
    toUserRefEntity(report.patient),
    report.analysis,
    report.review ?? null,
    report.title,
    report.content ?? null,
    report.recommendations ?? null,
    report.status ?? ReportStatus.DRAFT,
    report.sentAt ?? null,
    report.viewedAt ?? null,
    !!report.pdfSize,
    report.pdfSize ?? null,
    report.createdAt,
    report.updatedAt,
  );
