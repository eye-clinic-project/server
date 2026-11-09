import { Types } from 'mongoose';
import { SignedUrl, presentAnalysis, presentUser } from './presenter.js';
import { AnalysisStatus } from './enum/database.enum.js';

describe('presenter', () => {
  beforeAll(() => SignedUrl.configure(Buffer.alloc(32, 7)));

  it('signed URLs verify, and fail when tampered or expired', () => {
    const id = new Types.ObjectId().toString();
    const url = new URL(SignedUrl.sign('image', id), 'http://x');
    const exp = url.searchParams.get('exp')!;
    const sig = url.searchParams.get('sig')!;
    expect(SignedUrl.verify('image', id, exp, sig)).toBe(true);
    expect(SignedUrl.verify('gradcam', id, exp, sig)).toBe(false);
    expect(SignedUrl.verify('image', id, String(Number(exp) + 1), sig)).toBe(false);
    expect(SignedUrl.verify('image', id, exp, sig, Number(exp) * 1000 + 1)).toBe(false);
  });

  it('never exposes password hashes or storage keys', () => {
    const view = presentUser({ _id: new Types.ObjectId(), email: 'a@b.c', name: 'A', passwordHash: 'x', googleId: 'g', avatarKey: 'k' });
    expect(JSON.stringify(view)).not.toMatch(/passwordHash|googleId|"k"/);
    expect(view!.avatarUrl).toMatch(/^\/api\/v1\/files\/avatar\//);
  });

  it('completed analyses carry a plain-language grade and the disclaimer (NFR14, NFR19)', () => {
    const view = presentAnalysis({
      _id: new Types.ObjectId(),
      image: new Types.ObjectId(),
      status: AnalysisStatus.COMPLETED,
      hasDR: true,
      predictedLevel: 2,
      confidence: 0.8,
      gradCamKey: 'gradcam/x.png.enc',
    })!;
    expect(view.result?.gradeLabel).toBe('Moderate');
    expect(view.result?.referable).toBe(true);
    expect(view.result?.gradCamUrl).toMatch(/files\/gradcam/);
    expect(view.disclaimer).toMatch(/qualified doctor/);
    expect(JSON.stringify(view)).not.toContain('gradcam/x.png.enc');
  });
});
