import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { I18N_PATH, SUPPORTED_LOCALES } from './i18n.constants.js';

type Tree = { [key: string]: string | Tree };
const PLURAL = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);

/** key → placeholders, treating a plural object as one message. */
const messages = (tree: Tree, prefix = '', out = new Map<string, string[]>()) => {
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k;
    const isPlural = typeof v === 'object' && Object.keys(v).every((f) => PLURAL.has(f));
    if (typeof v === 'string' || isPlural) {
      const texts = typeof v === 'string' ? [v] : Object.values(v as Record<string, string>);
      const names = new Set(texts.flatMap((t) => [...t.matchAll(/\{(\w+)\}/g)].map((m) => m[1])));
      out.set(key, [...names].filter((n) => n !== 'count').sort());
    } else {
      messages(v as Tree, key, out);
    }
  }
  return out;
};

const load = (locale: string, file: string) =>
  messages(JSON.parse(readFileSync(join(I18N_PATH, locale, file), 'utf8')) as Tree);

describe('translation files', () => {
  const files = readdirSync(join(I18N_PATH, 'en')).filter((f) => f.endsWith('.json'));

  it.each(files)('%s has the same keys and placeholders in every language', (file) => {
    const english = load('en', file);
    for (const locale of SUPPORTED_LOCALES) {
      const other = load(locale, file);
      expect([...other.keys()].sort()).toEqual([...english.keys()].sort());
      for (const [key, names] of english) {
        expect({ key, names: other.get(key) }).toEqual({ key, names });
      }
    }
  });
});
