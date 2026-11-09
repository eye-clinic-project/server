import type { Types } from 'mongoose';
import {
  AnalysisStatus,
  DR_LEVEL_DESCRIPTIONS,
  DR_LEVEL_LABELS,
  DRLevel,
} from './enum/database.enum.js';
import { AI_DISCLAIMER } from './constant.js';


import { createHmac, timingSafeEqual } from 'node:crypto';
import { Localize } from './language/localize.js';

export const API_PREFIX = '/api/v1';

export type SignedFileKind = 'image' | 'gradcam' | 'avatar';

/**
 * Short-lived signed URLs for private files (NFR9), so <img> tags can load images
 * without exposing a public path. The expiry is rounded to the hour so the same URL
 * is reused (and cached by the browser) within that window.
 */
export class SignedUrl {
  private static secret: Buffer | null = null;
  static readonly TTL_SECONDS = 60 * 60;

  static configure(secret: Buffer) {
    SignedUrl.secret = secret;
  }

  private static signature(kind: string, id: string, exp: number): string {
    if (!SignedUrl.secret) throw new Error('SignedUrl is not configured');
    return createHmac('sha256', SignedUrl.secret)
      .update(`${kind}:${id}:${exp}`)
      .digest('base64url');
  }

  static sign(kind: SignedFileKind, id: string, now = Date.now()): string {
    const hour = 3600;
    const exp = (Math.floor(now / 1000 / hour) + 2) * hour; // valid 1-2h
    return `${API_PREFIX}/files/${kind}/${id}?exp=${exp}&sig=${SignedUrl.signature(kind, id, exp)}`;
  }

  static verify(kind: string, id: string, exp: string, sig: string, now = Date.now()): boolean {
    const expNum = Number(exp);
    if (!Number.isFinite(expNum) || expNum * 1000 < now || typeof sig !== 'string') return false;
    const expected = Buffer.from(SignedUrl.signature(kind, id, expNum));
    const given = Buffer.from(sig);
    return expected.length === given.length && timingSafeEqual(expected, given);
  }
}

const idOf = (value: unknown): string | null => {
  if (!value) return null;
  const v = value as { _id?: Types.ObjectId; toString(): string };
  return v._id ? v._id.toString() : v.toString();
};

/** Safe public view of a user: never includes password hash, Google id or storage keys. */
export const presentUser = (user: any) => {
  if (!user) return null;
  if (typeof user !== 'object' || !('email' in user)) return { id: idOf(user) };
  const id = idOf(user)!;
  return {
    id,
    _id: id,
    name: user.name,
    email: user.email,
    city: user.city,
    phone: user.phone ?? null,
    role: user.role,
    avatarUrl: user.avatarKey ? SignedUrl.sign('avatar', id) : (user.avatarUrl ?? null),
    provider: user.provider,
    emailVerifiedAt: user.emailVerifiedAt ?? null,
    isActive: user.isActive !== false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export const imageFileUrl = (imageId: string) =>
  `${API_PREFIX}/fundus-images/${imageId}/file`;
export const gradCamUrl = (analysisId: string) =>
  `${API_PREFIX}/analyses/${analysisId}/grad-cam`;

export const presentImage = (image: any) => {
  if (!image) return null;
  if (typeof image !== 'object' || !('mimeType' in image)) return { id: idOf(image) };
  const id = idOf(image)!;
  return {
    id,
    _id: id,
    patient: typeof image.patient === 'object' && 'email' in image.patient ? presentUser(image.patient) : idOf(image.patient),
    uploadedBy: typeof image.uploadedBy === 'object' && 'email' in image.uploadedBy ? presentUser(image.uploadedBy) : idOf(image.uploadedBy),
    eye: image.eye,
    source: image.source,
    mimeType: image.mimeType,
    size: image.size,
    sha256: image.sha256,
    originalName: image.originalName,
    notes: image.notes,
    capturedAt: image.capturedAt,
    device: idOf(image.device),
    fileUrl: SignedUrl.sign('image', id),
    createdAt: image.createdAt,
    updatedAt: image.updatedAt,
  };
};

/** Analysis with plain-language grade, URLs and the decision-support disclaimer (NFR14, NFR19). */
export const presentAnalysis = (analysis: any) => {
  if (!analysis) return null;
  const id = idOf(analysis)!;
  const level: DRLevel | null =
    analysis.predictedLevel === null || analysis.predictedLevel === undefined
      ? null
      : (analysis.predictedLevel as DRLevel);
  const completed = analysis.status === AnalysisStatus.COMPLETED;
  return {
    id,
    _id: id,
    status: analysis.status,
    doctor: typeof analysis.doctor === 'object' && analysis.doctor && 'email' in analysis.doctor ? presentUser(analysis.doctor) : idOf(analysis.doctor),
    patient: typeof analysis.patient === 'object' && analysis.patient && 'email' in analysis.patient ? presentUser(analysis.patient) : idOf(analysis.patient),
    image: typeof analysis.image === 'object' && analysis.image && 'mimeType' in analysis.image ? presentImage(analysis.image) : { id: idOf(analysis.image), fileUrl: SignedUrl.sign('image', idOf(analysis.image)!) },
    result: completed
      ? {
          hasDR: analysis.hasDR,
          drStatus: analysis.hasDR ? 'DR' : 'No DR',
          stage1Confidence: analysis.stage1Confidence,
          predictedLevel: level,
          gradeLabel: level === null ? null : DR_LEVEL_LABELS[level],
          gradeDescription: level === null ? null : DR_LEVEL_DESCRIPTIONS[level],
          referable: level !== null && level >= DRLevel.MODERATE,
          confidence: analysis.confidence,
          probabilities: analysis.probabilities ?? [],
          gradCamUrl: (analysis.hasGradCam ?? !!analysis.gradCamKey) ? SignedUrl.sign('gradcam', id) : null,
          modelVersion: analysis.modelVersion,
          isMock: !!analysis.isMock,
        }
      : null,
    error: Localize.text(analysis.error) ?? null,
    attempts: analysis.attempts,
    processingMs: analysis.processingMs ?? null,
    completedAt: analysis.completedAt ?? null,
    disclaimer: AI_DISCLAIMER,
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
  };
};

export const paged = <T>(
  result: { docs: unknown[]; count: number; currentPage: number; size: number; pages: number },
  map: (doc: any) => T,
) => ({
  items: result.docs.map(map),
  total: result.count,
  page: result.currentPage,
  size: result.size,
  pages: result.pages,
});
