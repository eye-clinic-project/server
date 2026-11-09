import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';

export interface AiPrediction {
  /** Stage-1: DR vs No DR. */
  hasDR: boolean;
  stage1Confidence: number;
  /** Stage-2: 0..4 (No DR, Mild, Moderate, Severe, Proliferative). */
  predictedLevel: number;
  confidence: number;
  probabilities: number[];
  gradCam: { data: Buffer; mimeType: 'image/png' | 'image/jpeg' } | null;
  modelVersion: string;
  isMock: boolean;
}

/** Thrown when the AI service says the picture is not a usable fundus image (NFR6). */
export class InvalidFundusImageError extends UnprocessableEntityException {}

/**
 * Client for the FastAPI AI module (NFR15: the AI runs as its own service).
 *
 * Expected remote contract (AI_MODE=remote):
 *   POST {AI_SERVICE_URL}/predict   multipart/form-data, field "file" (JPEG/PNG)
 *   200 {
 *     "stage1": { "has_dr": bool, "confidence": 0..1 },
 *     "stage2": { "level": 0..4, "confidence": 0..1, "probabilities": [5 floats] } | null,
 *     "grad_cam_png_base64": "<base64 png>" | null,
 *     "model_version": "effnet-b3-ensemble-v4"
 *   }
 *   422 { "detail": "Not a fundus image" }   -> rejected input
 *   GET  {AI_SERVICE_URL}/health  -> 200 when the model is loaded
 *   GET  {AI_SERVICE_URL}/model-info -> any JSON
 * Preprocessing (resize, crop, CLAHE), TTA and Grad-CAM all happen inside the AI service.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly config: ConfigService) {}

  get mode(): 'disabled' | 'mock' | 'remote' {
    return this.config.get('ai.mode', 'disabled');
  }

  private get baseUrl(): string | undefined {
    return this.config.get<string>('ai.url')?.replace(/\/$/, '');
  }

  private headers(): Record<string, string> {
    const key = this.config.get<string>('ai.apiKey');
    return key ? { 'x-api-key': key } : {};
  }

  async health(): Promise<{ mode: string; available: boolean; detail?: unknown }> {
    if (this.mode === 'mock') return { mode: 'mock', available: true };
    if (this.mode === 'disabled' || !this.baseUrl) {
      return { mode: this.mode, available: false, detail: 'AI service is not connected yet' };
    }
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: this.headers(),
        signal: AbortSignal.timeout(3_000),
      });
      return {
        mode: 'remote',
        available: response.ok,
        detail: await response.json().catch(() => undefined),
      };
    } catch (error) {
      return { mode: 'remote', available: false, detail: (error as Error).message };
    }
  }

  async modelInfo(): Promise<unknown> {
    if (this.mode === 'mock') {
      return { mode: 'mock', modelVersion: 'mock-0', note: 'Demo predictions only, not a real model' };
    }
    if (this.mode === 'disabled' || !this.baseUrl) {
      throw new ServiceUnavailableException('AI service is not connected yet');
    }
    const response = await fetch(`${this.baseUrl}/model-info`, {
      headers: this.headers(),
      signal: AbortSignal.timeout(3_000),
    }).catch((error: Error) => {
      throw new ServiceUnavailableException('AI service is unavailable', { cause: error });
    });
    if (!response.ok) throw new ServiceUnavailableException('AI service is unavailable');
    return response.json();
  }

  async predict(image: Buffer, mimeType: string): Promise<AiPrediction> {
    switch (this.mode) {
      case 'mock':
        return this.mockPredict(image);
      case 'remote':
        return this.remotePredict(image, mimeType);
      default:
        throw new ServiceUnavailableException(
          'AI detection service is not available yet. Please retry later.',
        );
    }
  }

  private async remotePredict(image: Buffer, mimeType: string): Promise<AiPrediction> {
    if (!this.baseUrl) {
      throw new ServiceUnavailableException('AI_SERVICE_URL is not configured');
    }
    const form = new FormData();
    form.append(
      'file',
      new Blob([new Uint8Array(image)], { type: mimeType }),
      mimeType === 'image/png' ? 'fundus.png' : 'fundus.jpg',
    );

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/predict`, {
        method: 'POST',
        body: form,
        headers: this.headers(),
        signal: AbortSignal.timeout(this.config.get<number>('ai.timeoutMs', 20_000)),
      });
    } catch (error) {
      throw new ServiceUnavailableException('AI service is unavailable', { cause: error });
    }

    const body = (await response.json().catch(() => ({}))) as Record<string, any>;
    if (response.status === 422 || response.status === 400) {
      throw new InvalidFundusImageError(
        typeof body.detail === 'string' ? body.detail : 'The image is not a valid fundus image',
      );
    }
    if (!response.ok) {
      this.logger.error(`AI service responded ${response.status}`);
      throw new ServiceUnavailableException('AI service failed to analyse the image');
    }

    const stage1 = body.stage1 ?? {};
    const stage2 = body.stage2 ?? null;
    const hasDR = Boolean(stage1.has_dr);
    const level = hasDR && stage2 ? Number(stage2.level) : 0;
    if (!Number.isInteger(level) || level < 0 || level > 4) {
      throw new ServiceUnavailableException('AI service returned an invalid grade');
    }
    return {
      hasDR,
      stage1Confidence: Number(stage1.confidence ?? 0),
      predictedLevel: level,
      confidence: Number(stage2?.confidence ?? stage1.confidence ?? 0),
      probabilities: Array.isArray(stage2?.probabilities) ? stage2.probabilities.map(Number) : [],
      gradCam: body.grad_cam_png_base64
        ? { data: Buffer.from(body.grad_cam_png_base64, 'base64'), mimeType: 'image/png' }
        : null,
      modelVersion: String(body.model_version ?? 'unknown'),
      isMock: false,
    };
  }

  /** Deterministic fake output for UI demos. Never use for clinical decisions. */
  private mockPredict(image: Buffer): AiPrediction {
    const digest = createHash('sha256').update(image).digest();
    const level = digest[0] % 5;
    const raw = Array.from({ length: 5 }, (_, i) => (i === level ? 4 : 0.2) + digest[i + 1] / 255);
    const total = raw.reduce((a, b) => a + b, 0);
    const probabilities = raw.map((p) => Math.round((p / total) * 1000) / 1000);
    return {
      hasDR: level > 0,
      stage1Confidence: Math.round((0.8 + (digest[6] / 255) * 0.19) * 1000) / 1000,
      predictedLevel: level,
      confidence: probabilities[level],
      probabilities,
      gradCam: null,
      modelVersion: 'mock-0',
      isMock: true,
    };
  }
}
