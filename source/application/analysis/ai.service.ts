import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';

import { DR_LEVEL_VALUES, type DRLevel, Stage1Status } from '../../dependencies/enum/index.js';
import type { IAnalysisFinding } from '../../dependencies/interface/index.js';

export const sha256 = (data: Buffer): string => createHash('sha256').update(data).digest('hex');

export type AiMode = 'remote' | 'mock' | 'disabled';

export interface AiPrediction {
  hasDR: boolean;
  stage1Confidence: number;
  drProbability: number;
  drThreshold: number | null;
  stage1Status: Stage1Status;
  shownFindings: string[];
  topFinding: string | null;
  findings: IAnalysisFinding[];
  predictedLevel: DRLevel | null;
  confidence: number | null;
  probabilities: number[];
  gradCamPng: Buffer | null;
  gradCamClass: string | null;
  modelVersion: string;
  processingMs: number;
  isMock: boolean;
}

export interface AiHealth {
  mode: AiMode;
  available: boolean;
  modelVersion: string | null;
  error: string | null;
  info?: unknown;
}

export class AiError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
  ) {
    super(message);
  }
}

interface RemoteFinding {
  code: string;
  name: string;
  probability: number;
  threshold: number;
  detected: boolean;
}

interface RemotePrediction {
  model_version: string;
  stage1: {
    has_dr: boolean;
    confidence: number;
    dr_probability: number;
    threshold?: number;
    status?: string;
    detected?: string[];
    shown?: string[];
    top?: string;
    findings: RemoteFinding[];
    trigger_stage2?: boolean;
  };
  stage2: { level?: number; grade?: number; confidence?: number; probabilities?: number[] } | null;
  grad_cam_class?: string | null;
  grad_cam_png_base64?: string | null;
  processing_ms?: number;
}

const MOCK_CLASSES: [string, string][] = [
  ['N', 'Normal'],
  ['D', 'Diabetic Retinopathy'],
  ['G', 'Glaucoma'],
  ['C', 'Cataract'],
  ['A', 'AMD'],
  ['H', 'Hypertensive Retinopathy'],
  ['M', 'Pathological Myopia'],
  ['O', 'Other abnormalities'],
];

const round = (value: number) => Math.round(value * 10_000) / 10_000;

const FUNDUS_EXTENSIONS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  readonly mode: AiMode;
  private readonly url: string | null;
  private readonly apiKey: string | null;
  private readonly timeoutMs: number;

  constructor(configService: ConfigService) {
    const mode = configService.get<string>('app.ai.mode');
    this.mode = mode === 'remote' || mode === 'mock' ? mode : 'disabled';
    this.url = configService.get<string>('app.ai.url')?.replace(/\/$/, '') || null;
    this.apiKey = configService.get<string>('app.ai.apiKey') || null;
    this.timeoutMs = configService.get<number>('app.ai.timeout') ?? 60_000;
  }

  async predict(image: Buffer, contentType: string, sha256: string): Promise<AiPrediction> {
    if (this.mode === 'mock') return this.mockPrediction(sha256);
    if (this.mode !== 'remote') throw new AiError('AI detection service is not available yet. Please retry later.', true);
    if (!this.url) throw new AiError('AI_SERVICE_URL is not configured', true);

    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(image)], { type: contentType }), `fundus.${FUNDUS_EXTENSIONS[contentType] ?? 'jpg'}`);

    const response = await this.request('/predict?grad_cam=true', { method: 'POST', body: form });
    if (!response.ok) throw await this.toError(response);

    const body = (await response.json()) as RemotePrediction;
    return this.mapPrediction(body);
  }

  async health(): Promise<AiHealth> {
    if (this.mode === 'mock') return { mode: this.mode, available: true, modelVersion: 'mock', error: null };
    if (this.mode !== 'remote')
      return { mode: this.mode, available: false, modelVersion: null, error: 'AI detection service is not available yet. Please retry later.' };
    if (!this.url) return { mode: this.mode, available: false, modelVersion: null, error: 'AI_SERVICE_URL is not configured' };

    try {
      const response = await this.request('/health', { method: 'GET' });
      const body = (await response.json().catch(() => ({}))) as { model_version?: string; error?: string };
      if (!response.ok)
        return { mode: this.mode, available: false, modelVersion: body.model_version ?? null, error: body.error ?? (await this.toError(response)).message };

      const info = await this.request('/model-info', { method: 'GET' })
        .then((res) => (res.ok ? res.json() : undefined))
        .catch(() => undefined);
      return { mode: this.mode, available: true, modelVersion: body.model_version ?? null, error: null, info };
    } catch (error) {
      return { mode: this.mode, available: false, modelVersion: null, error: (error as Error).message };
    }
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(`${this.url}${path}`, {
        ...init,
        headers: { ...(this.apiKey && { 'x-api-key': this.apiKey }), accept: 'application/json' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      this.logger.warn(`AI service request ${path} failed: ${(error as Error).message}`);
      throw new AiError('AI service is unavailable', true);
    }
  }

  private async toError(response: Response): Promise<AiError> {
    const detail = await response
      .json()
      .then((body: { detail?: unknown }) => (typeof body.detail === 'string' ? body.detail : ''))
      .catch(() => '');
    this.logger.warn(`AI service answered ${response.status}${detail ? `: ${detail}` : ''}`);

    if (response.status === 401 || response.status === 403) return new AiError('AI service is not connected yet', true);
    if (response.status === 422 || response.status === 400 || response.status === 413) return new AiError('The image is not a valid fundus image', false);
    if (response.status === 503 || response.status === 502 || response.status === 504) return new AiError('AI service is unavailable', true);
    return new AiError('AI service failed to analyse the image', true);
  }

  private mapPrediction(body: RemotePrediction): AiPrediction {
    const stage1 = body.stage1;
    if (!stage1 || typeof stage1.has_dr !== 'boolean') throw new AiError('AI service failed to analyse the image', true);

    const level = body.stage2 ? (body.stage2.level ?? body.stage2.grade) : null;
    if (level !== null && level !== undefined && !DR_LEVEL_VALUES.includes(level as DRLevel)) throw new AiError('AI service returned an invalid grade', true);

    const findings = (stage1.findings ?? []).map(({ code, name, probability, threshold, detected }) => ({ code, name, probability, threshold, detected }));
    const detected = findings.filter((finding) => finding.detected).map((finding) => finding.code);
    const status = stage1.status === Stage1Status.SUSPECTED || stage1.status === Stage1Status.DETECTED ? stage1.status : detected.length ? Stage1Status.DETECTED : Stage1Status.SUSPECTED;

    return {
      hasDR: stage1.has_dr,
      stage1Confidence: stage1.confidence,
      drProbability: stage1.dr_probability,
      drThreshold: stage1.threshold ?? findings.find((finding) => finding.code === 'D')?.threshold ?? null,
      stage1Status: status,
      shownFindings: stage1.shown ?? detected,
      topFinding: stage1.top ?? null,
      findings,
      predictedLevel: (level ?? null) as DRLevel | null,
      confidence: body.stage2?.confidence ?? null,
      probabilities: body.stage2?.probabilities ?? [],
      gradCamPng: body.grad_cam_png_base64 ? Buffer.from(body.grad_cam_png_base64, 'base64') : null,
      gradCamClass: body.grad_cam_class ?? null,
      modelVersion: body.model_version,
      processingMs: body.processing_ms ?? 0,
      isMock: false,
    };
  }

  private mockPrediction(sha256: string): AiPrediction {
    const seed = (offset: number) => parseInt(sha256.slice(offset, offset + 4), 16) / 0xffff;
    const drProbability = round(seed(0));
    const findings = MOCK_CLASSES.map(([code, name], index) => {
      const probability = code === 'D' ? drProbability : code === 'N' ? round(1 - drProbability) : round(seed(4 + index * 4) * 0.3);
      return { code, name, probability, threshold: 0.5, detected: probability >= 0.5 };
    });
    const hasDR = drProbability >= 0.5;
    const detected = findings.filter((finding) => finding.detected).map((finding) => finding.code);
    const ranked = [...findings].sort((a, b) => b.probability - a.probability);
    return {
      hasDR,
      stage1Confidence: round(hasDR ? drProbability : 1 - drProbability),
      drProbability,
      drThreshold: 0.5,
      stage1Status: detected.length ? Stage1Status.DETECTED : Stage1Status.SUSPECTED,
      shownFindings: detected.length ? detected : ranked.slice(0, 3).filter((finding) => finding.probability >= 0.15).map((finding) => finding.code),
      topFinding: ranked[0]?.code ?? null,
      findings,
      predictedLevel: null,
      confidence: null,
      probabilities: [],
      gradCamPng: null,
      gradCamClass: null,
      modelVersion: 'mock',
      processingMs: 0,
      isMock: true,
    };
  }
}
