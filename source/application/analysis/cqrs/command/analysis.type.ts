import type { DRLevel } from '../../../../dependencies/enum/index.js';

export interface ReviewData {
  aiResultConfirmed?: boolean;
  confirmedLevel?: DRLevel;
  notes?: string;
  recommendations?: string;
  followUpDate?: Date;
}

export interface ReportData {
  title?: string;
  content?: string;
  recommendations?: string;
}
