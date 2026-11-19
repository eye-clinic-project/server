import { join } from 'node:path';

export const I18N_PATH = join(import.meta.dirname, '..', '..', 'i18n');
export const SUPPORTED_LOCALES = ['en', 'ar'] as const;
export const DEFAULT_LOCALE = 'en';
