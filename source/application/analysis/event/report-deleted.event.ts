export const REPORT_DELETED_EVENT = 'report.deleted';

export class ReportDeletedEvent {
  constructor(
    public readonly reportId: string,
    public readonly pdfKey: string | null,
  ) {}
}
