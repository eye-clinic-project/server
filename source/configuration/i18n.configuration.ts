import { AcceptLanguageLocaleResolver, HeaderLocaleResolver, JsonI18nLoader, QueryLocaleResolver, type I18nForRootOptions } from '@nestjs/i18n';
import { DEFAULT_LOCALE, I18N_PATH, SUPPORTED_LOCALES } from '../dependencies/language/index.js';

export const i18nOptions: I18nForRootOptions = {
  loader: new JsonI18nLoader({ path: I18N_PATH }),
  defaultLocale: DEFAULT_LOCALE,
  supportedLocales: [...SUPPORTED_LOCALES],
  resolvers: [new QueryLocaleResolver('language'), new HeaderLocaleResolver('x-language'), new AcceptLanguageLocaleResolver()],
};
