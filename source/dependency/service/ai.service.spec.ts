import { ServiceUnavailableException } from '@nestjs/common';
import { afterEach, vi } from 'vitest';
import { AiService, InvalidFundusImageError } from './ai.service.js';

const service = (mode: string) => new AiService({ get: (key: string, fallback?: unknown) => (key === 'ai.mode' ? mode : fallback) } as any);

describe('AiService', () => {
  it('disabled mode fails with a retryable 503', async () => {
    await expect(service('disabled').predict(Buffer.from('x'), 'image/jpeg')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
  it('mock mode is deterministic and returns exactly one of five grades', async () => {
    const ai = service('mock');
    const a = await ai.predict(Buffer.from('image-a'), 'image/jpeg');
    const b = await ai.predict(Buffer.from('image-a'), 'image/jpeg');
    expect(a).toEqual(b);
    expect([0, 1, 2, 3, 4]).toContain(a.predictedLevel);
    expect(a.hasDR).toBe((a.predictedLevel ?? 0) > 0);
    expect(a.isMock).toBe(true);
    expect(a.probabilities).toHaveLength(5);
  });

  describe('remote mode (FastAPI in /core)', () => {
    const remote = () =>
      new AiService({
        get: (key: string, fallback?: unknown) => ({ 'ai.mode': 'remote', 'ai.url': 'http://ai.test/', 'ai.apiKey': 'k' })[key] ?? fallback,
      } as any);
    const reply = (status: number, body: unknown) =>
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));
    const stage1 = (hasDr: boolean) => ({
      has_dr: hasDr,
      confidence: 0.91,
      findings: [{ code: 'D', name: 'Diabetic Retinopathy', probability: hasDr ? 0.91 : 0.09, threshold: 0.575, detected: hasDr }],
    });

    afterEach(() => vi.restoreAllMocks());

    it('sends the image with the API key and maps a stage-1-only "no DR" result to grade 0', async () => {
      const fetchMock = reply(200, {
        model_version: 'effnet-b3-stage1-ens3',
        stage1: stage1(false),
        stage2: null,
        grad_cam_png_base64: Buffer.from('png').toString('base64'),
      });
      const p = await remote().predict(Buffer.from('img'), 'image/jpeg');
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://ai.test/predict');
      expect((init.headers as Record<string, string>)['x-api-key']).toBe('k');
      expect(p).toMatchObject({ hasDR: false, predictedLevel: 0, stage1Confidence: 0.91, modelVersion: 'effnet-b3-stage1-ens3', isMock: false });
      expect(p.findings).toEqual([{ code: 'D', name: 'Diabetic Retinopathy', probability: 0.09, threshold: 0.575, detected: false }]);
      expect(p.gradCam?.data.toString()).toBe('png');
    });

    it('leaves the grade empty when DR is detected but there is no stage-2 model', async () => {
      reply(200, { model_version: 'v', stage1: stage1(true), stage2: null });
      const p = await remote().predict(Buffer.from('img'), 'image/jpeg');
      expect(p.hasDR).toBe(true);
      expect(p.predictedLevel).toBeNull();
    });

    it('uses the stage-2 grade when present', async () => {
      reply(200, { model_version: 'v', stage1: stage1(true), stage2: { level: 3, confidence: 0.7, probabilities: [0.05, 0.05, 0.1, 0.7, 0.1] } });
      const p = await remote().predict(Buffer.from('img'), 'image/jpeg');
      expect(p).toMatchObject({ predictedLevel: 3, confidence: 0.7 });
    });

    it('turns a 422 from the model into an invalid-image error', async () => {
      reply(422, { detail: 'The file could not be decoded as an image' });
      await expect(remote().predict(Buffer.from('x'), 'image/jpeg')).rejects.toBeInstanceOf(InvalidFundusImageError);
    });

    it('treats a 503 (weights not loaded) as service unavailable', async () => {
      reply(503, { detail: 'Model is not loaded' });
      await expect(remote().predict(Buffer.from('x'), 'image/jpeg')).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });
});
