import { Injectable, Logger, ServiceUnavailableException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';

export interface AiFinding {
  code: string;
  name: string;
  probability: number;
  threshold: number;
  detected: boolean;
}

export interface AiPrediction {
  hasDR: boolean;
  stage1Confidence: number;
  /** Five-level grade. Null when DR was detected but no stage-2 grading model is deployed. */
  predictedLevel: number | null;
  confidence: number;
  probabilities: number[];
  findings: AiFinding[];
  gradCam: { data: Buffer; mimeType: 'image/png' | 'image/jpeg' } | null;
  modelVersion: string;
  isMock: boolean;
}

export class InvalidFundusImageError extends UnprocessableEntityException {}

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
        throw new ServiceUnavailableException('AI detection service is not available yet. Please retry later.');
    }
  }

  private async remotePredict(image: Buffer, mimeType: string): Promise<AiPrediction> {
    if (!this.baseUrl) {
      throw new ServiceUnavailableException('AI_SERVICE_URL is not configured');
    }
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(image)], { type: mimeType }), mimeType === 'image/png' ? 'fundus.png' : 'fundus.jpg');

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
      throw new InvalidFundusImageError(typeof body.detail === 'string' ? body.detail : 'The image is not a valid fundus image');
    }
    if (!response.ok) {
      this.logger.error(`AI service responded ${response.status}`);
      throw new ServiceUnavailableException('AI service failed to analyse the image');
    }
    const stage1 = body.stage1 ?? {};
    const stage2 = body.stage2 ?? null;
    const hasDR = Boolean(stage1.has_dr);
    // No DR -> grade 0. DR without a stage-2 model -> no grade (the doctor grades it), never "No DR".
    const level = !hasDR ? 0 : stage2 ? Number(stage2.level) : null;
    if (level !== null && (!Number.isInteger(level) || level < 0 || level > 4)) {
      throw new ServiceUnavailableException('AI service returned an invalid grade');
    }
    const clamp01 = (v: unknown) => Math.min(1, Math.max(0, Number(v) || 0));
    const findings: AiFinding[] = Array.isArray(stage1.findings)
      ? stage1.findings.map((f: Record<string, unknown>) => ({
          code: String(f.code),
          name: String(f.name),
          probability: clamp01(f.probability),
          threshold: clamp01(f.threshold),
          detected: Boolean(f.detected),
        }))
      : [];
    return {
      hasDR,
      stage1Confidence: clamp01(stage1.confidence),
      predictedLevel: level,
      confidence: clamp01(stage2?.confidence ?? stage1.confidence),
      probabilities: Array.isArray(stage2?.probabilities) ? stage2.probabilities.map(Number) : [],
      findings,
      gradCam: body.grad_cam_png_base64 ? { data: Buffer.from(body.grad_cam_png_base64, 'base64'), mimeType: 'image/png' } : null,
      modelVersion: String(body.model_version ?? 'unknown'),
      isMock: false,
    };
  }

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
      findings: [],
      gradCam: null,
      modelVersion: 'mock-0',
      isMock: true,
    };
  }
}
