import type { ConfigService } from '@nestjs/config';

import { Stage1Status } from '../../dependencies/enum/index.js';
import { AiService } from './ai.service.js';

const config = (values: Record<string, unknown>) => ({ get: (key: string) => values[key] }) as unknown as ConfigService;

// Shape returned by core/src/analysis.py Stage1Model.predict()
const corePrediction = {
  model_version: 'effnet-b5-stage1-ens3',
  stage1: {
    has_dr: true,
    confidence: 0.83,
    dr_probability: 0.83,
    threshold: 0.575,
    status: 'DETECTED',
    detected: ['D'],
    shown: ['D'],
    top: 'D',
    findings: [
      { code: 'N', name: 'Normal', probability: 0.1, threshold: 0.475, detected: false },
      { code: 'D', name: 'Diabetic Retinopathy', probability: 0.83, threshold: 0.575, detected: true },
    ],
    trigger_stage2: true,
  },
  stage2: null,
  grad_cam_class: 'D',
  grad_cam_png_base64: Buffer.from('png').toString('base64'),
  processing_ms: 4300,
};

describe('AiService', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('maps the core stage-1 response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(corePrediction), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const service = new AiService(config({ 'app.ai.mode': 'remote', 'app.ai.url': 'http://core:8001/', 'app.ai.apiKey': 'k' }));

    const prediction = await service.predict(Buffer.from('img'), 'image/png', 'hash');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://core:8001/predict?grad_cam=true');
    expect((init.headers as Record<string, string>)['x-api-key']).toBe('k');
    expect(prediction).toMatchObject({
      hasDR: true,
      stage1Confidence: 0.83,
      drProbability: 0.83,
      drThreshold: 0.575,
      stage1Status: Stage1Status.DETECTED,
      shownFindings: ['D'],
      topFinding: 'D',
      gradCamClass: 'D',
      predictedLevel: null,
      modelVersion: 'effnet-b5-stage1-ens3',
      processingMs: 4300,
      isMock: false,
    });
    expect(prediction.findings).toHaveLength(2);
    expect(prediction.gradCamPng?.toString()).toBe('png');
  });

  it('turns a 422 from core into a non-retryable error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: 'bad image' }), { status: 422 })));
    const service = new AiService(config({ 'app.ai.mode': 'remote', 'app.ai.url': 'http://core:8001' }));

    await expect(service.predict(Buffer.from('img'), 'image/png', 'hash')).rejects.toMatchObject({ retryable: false });
  });

  it('mock mode returns the same stage-1 shape', async () => {
    const service = new AiService(config({ 'app.ai.mode': 'mock' }));
    const prediction = await service.predict(Buffer.from('img'), 'image/png', 'a'.repeat(64));

    expect(Object.values(Stage1Status)).toContain(prediction.stage1Status);
    expect(prediction.findings).toHaveLength(8);
    expect(prediction.topFinding).not.toBeNull();
  });
});
