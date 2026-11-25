import type { Types } from 'mongoose';

import { type AnalysisStatus, type DRLevel, type EyeSide, type Stage1Status, DR_LEVEL_LABELS } from '../../../dependencies/enum/database.enum.js';
import type { IAnalysisFinding, IAnalysisHistoryEntry } from '../../../dependencies/interface/database.interface.js';
import { toUserRefEntity, type UserRefEntity } from './user-ref.entity.js';
import type { AnalysisView } from '../type/analysis.type.js';
import { Localize } from '../../../dependencies/language/localize.js';

export type AnalysisImageEntity = {
  _id: Types.ObjectId;
  eye: EyeSide;
  originalName: string | null;
  notes: string | null;
  capturedAt: Date | null;
  mimeType: string;
  size: number;
} | null;

export type AnalysisStage1Entity = {
  hasDR: boolean | null;
  confidence: number | null;
  drProbability: number | null;
  threshold: number | null;
  status: Stage1Status | null;
  detected: string[];
  shown: string[];
  top: string | null;
  gradCamClass: string | null;
  findings: IAnalysisFinding[];
};

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

const toAnalysisImageEntity = (image: AnalysisView['image']): AnalysisImageEntity =>
  image
    ? {
        _id: image._id,
        eye: image.eye,
        originalName: image.originalName ?? null,
        notes: image.notes ?? null,
        capturedAt: image.capturedAt ?? null,
        mimeType: image.mimeType,
        size: image.size,
      }
    : null;
export const toAnalysisEntity = (analysis: AnalysisView): AnalysisEntity => {
  const level = analysis.predictedLevel ?? null;
  const findings = analysis.findings ?? [];
  return new AnalysisEntity(
    analysis._id,
    analysis.doctor,
    toUserRefEntity(analysis.patient),
    toAnalysisImageEntity(analysis.image),
    analysis.status,
    {
      hasDR: analysis.hasDR ?? null,
      confidence: analysis.stage1Confidence ?? null,
      drProbability: analysis.drProbability ?? null,
      threshold: analysis.drThreshold ?? null,
      status: analysis.stage1Status ?? null,
      detected: findings.filter((finding) => finding.detected).map((finding) => finding.code),
      shown: analysis.shownFindings ?? [],
      top: analysis.topFinding ?? null,
      gradCamClass: analysis.gradCamClass ?? null,
      findings,
    },
    {
      available: level !== null,
      predictedLevel: level,
      label: level !== null ? DR_LEVEL_LABELS[level] : null,
      confidence: analysis.confidence ?? null,
      probabilities: analysis.probabilities ?? [],
    },
    !!analysis.gradCamKey,
    analysis.modelVersion ?? null,
    analysis.isMock ?? false,
    Localize.text(analysis.error ?? null) ?? null,
    analysis.attempts,
    analysis.processingMs ?? null,
    analysis.completedAt ?? null,
    analysis.reviewedAt ?? null,
    (analysis.history ?? []).map((entry) => ({ ...entry, message: Localize.text(entry.message) ?? undefined })),
    analysis.createdAt,
    analysis.updatedAt,
  );
};
