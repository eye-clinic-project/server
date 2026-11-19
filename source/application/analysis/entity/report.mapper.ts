import type { ReportView } from './analysis.type.js';
import { ReportEntity } from './report.entity.js';
import { ReportStatus } from '../../../dependencies/enum/index.js';
import { toUserRefEntity } from './user-ref.mapper.js';

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
