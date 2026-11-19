export const REPORT_SENT_EVENT = 'report.sent';

export class ReportSentEvent {
  constructor(
    public readonly reportId: string,
    public readonly patientId: string,
    public readonly doctorName: string,
  ) {}
}
