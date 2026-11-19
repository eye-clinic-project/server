import type { Types } from 'mongoose';

import type { AnalysisStatus, DRLevel, EyeSide } from '../../../dependencies/enum/index.js';
import type { IAnalysisFinding, IAnalysisHistoryEntry } from '../../../dependencies/interface/index.js';
import type { UserRefEntity } from './analysis.type.js';

export type AnalysisImageEntity = {
  _id: Types.ObjectId;
  eye: EyeSide;
  originalName: string | null;
  notes: string | null;
  capturedAt: Date | null;
  mimeType: string;
  size: number;
} | null;

export type AnalysisStage1Entity = { hasDR: boolean | null; confidence: number | null; findings: IAnalysisFinding[] };

export type AnalysisStage2Entity = {
  available: boolean;
  predictedLevel: DRLevel | null;
  label: string | null;
  confidence: number | null;
  probabilities: number[];
};

export class AnalysisEntity {
  constructor(
    public readonly _id: Types.ObjectId,
    public readonly doctor: Types.ObjectId,
    public readonly patient: UserRefEntity,
    public readonly image: AnalysisImageEntity,
    public readonly status: AnalysisStatus,
    public readonly stage1: AnalysisStage1Entity,
    public readonly stage2: AnalysisStage2Entity,
    public readonly hasGradCam: boolean,
    public readonly modelVersion: string | null,
    public readonly isMock: boolean,
    public readonly error: string | null,
    public readonly attempts: number,
    public readonly processingMs: number | null,
    public readonly completedAt: Date | null,
    public readonly reviewedAt: Date | null,
    public readonly history: IAnalysisHistoryEntry[],
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
