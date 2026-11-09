import { ServiceUnavailableException } from '@nestjs/common';
import { AiService } from './ai.service.js';

const service = (mode: string) =>
  new AiService({ get: (key: string, fallback?: unknown) => (key === 'ai.mode' ? mode : fallback) } as any);

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
    expect(a.hasDR).toBe(a.predictedLevel > 0);
    expect(a.isMock).toBe(true);
    expect(a.probabilities).toHaveLength(5);
  });
});
