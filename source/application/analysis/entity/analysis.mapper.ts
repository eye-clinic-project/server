import type { AnalysisView } from './analysis.type.js';
import { AnalysisEntity, type AnalysisImageEntity } from './analysis.entity.js';
import { DR_LEVEL_LABELS } from '../../../dependencies/enum/index.js';
import { Localize } from '../../../dependencies/language/index.js';
import { toUserRefEntity } from './user-ref.mapper.js';

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
  return new AnalysisEntity(
    analysis._id,
    analysis.doctor,
    toUserRefEntity(analysis.patient),
    toAnalysisImageEntity(analysis.image),
    analysis.status,
    { hasDR: analysis.hasDR ?? null, confidence: analysis.stage1Confidence ?? null, findings: analysis.findings ?? [] },
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
