import { BadRequestException } from '@nestjs/common';
import { buildSlots } from './doctor-availability.service.js';

describe('buildSlots', () => {
  const start = new Date('2030-01-01T09:00:00Z');
  it('splits a range into equal slots', () => {
    const slots = buildSlots(start, new Date('2030-01-01T10:00:00Z'), 20);
    expect(slots).toHaveLength(3);
    expect(slots[2].endAt.toISOString()).toBe('2030-01-01T10:00:00.000Z');
  });
  it('keeps a single slot when no length is given', () => {
    expect(buildSlots(start, new Date('2030-01-01T09:45:00Z'))).toHaveLength(1);
  });
  it('rejects empty or reversed ranges', () => {
    expect(() => buildSlots(start, start)).toThrow(BadRequestException);
    expect(() => buildSlots(start, new Date('2030-01-01T09:10:00Z'), 30)).toThrow(BadRequestException);
  });
});
