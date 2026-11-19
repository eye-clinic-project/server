export const ANALYSIS_DELETED_EVENT = 'analysis.deleted';

export class AnalysisDeletedEvent {
  constructor(
    public readonly analysisId: string,
    public readonly fileKeys: string[],
  ) {}
}
