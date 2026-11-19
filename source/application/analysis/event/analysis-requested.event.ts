export const ANALYSIS_REQUESTED_EVENT = 'analysis.requested';

export class AnalysisRequestedEvent {
  constructor(
    public readonly analysisId: string,
    public readonly doctorId: string,
  ) {}
}
