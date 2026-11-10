import type { I18nService } from '@nestjs/i18n';
import { Localize } from './localize.js';

describe('Localize', () => {
  const i18n = {
    translate: vi.fn((key: string, options?: { args?: Record<string, unknown> }) => `${key}${options?.args ? ' ' + JSON.stringify(options.args) : ''}`),
  } as unknown as I18nService;
  const localize = new Localize(i18n);
  localize.onModuleInit();

  it('maps an exact English message to its key', () => {
    expect(localize.translate('Patient not found')).toBe('errors.patients.patientNotFound');
  });

  it('extracts placeholders from messages with dynamic parts', () => {
    expect(localize.translate('Cannot change a cancelled appointment to confirmed')).toBe(
      'errors.appointments.cannotTransition {"status":"cancelled","to":"confirmed"}',
    );
    expect(localize.translate('Image is too large. The maximum size is 10 MB')).toBe('errors.images.tooLarge {"size":"10"}');
  });

  it('leaves unknown messages unchanged', () => {
    expect(localize.translate('Something nobody translated')).toBe('Something nobody translated');
    expect(Localize.text(null)).toBeNull();
  });
});
