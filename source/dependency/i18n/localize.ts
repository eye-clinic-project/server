import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { I18nService } from '@nestjs/i18n';
import { DEFAULT_LOCALE, I18N_PATH } from './i18n.constants.js';

type Template = { key: string; regex: RegExp; names: string[]; literal: number };

const flatten = (obj: Record<string, unknown>, prefix: string, out: Record<string, string>) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = `${prefix}.${k}`;
    if (typeof v === 'string') out[key] = v;
    else if (v && typeof v === 'object') flatten(v as Record<string, unknown>, key, out);
  }
  return out;
};

/**
 * Translates the English messages the API throws (`new NotFoundException('Patient not found')`)
 * into the request's language, using `i18n/<locale>/errors.json`.
 *
 * Services keep throwing plain English; the English catalog maps each message back to its key,
 * and `{placeholders}` in a message (e.g. "A {status} appointment cannot be changed") are
 * matched and passed on as arguments. Unknown messages are returned unchanged.
 */
@Injectable()
export class Localize implements OnModuleInit {
  private static instance?: Localize;
  private readonly logger = new Logger(Localize.name);
  private readonly exact = new Map<string, string>();
  private readonly templates: Template[] = [];

  constructor(private readonly i18n: I18nService) {
    const file = join(I18N_PATH, DEFAULT_LOCALE, 'errors.json');
    try {
      const english = flatten(JSON.parse(readFileSync(file, 'utf8')), 'errors', {});
      for (const [key, text] of Object.entries(english)) {
        const names = [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
        if (!names.length) {
          this.exact.set(text, key);
          continue;
        }
        const pattern = text
          .split(/\{\w+\}/)
          .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join('(.+?)');
        this.templates.push({
          key,
          names,
          regex: new RegExp(`^${pattern}$`),
          literal: text.replace(/\{\w+\}/g, '').length,
        });
      }
      // Most specific first, so "Cannot {method} {path}" does not swallow
      // "Cannot change a {status} appointment to {to}".
      this.templates.sort((x, y) => y.literal - x.literal);
    } catch (error) {
      this.logger.error(`Could not load ${file}: ${(error as Error).message}`);
    }
  }

  onModuleInit() {
    Localize.instance = this;
  }

  /** Translates one message for the current request's locale. */
  translate(text: string): string {
    const key = this.exact.get(text);
    if (key) return this.i18n.translate(key);
    for (const template of this.templates) {
      const match = template.regex.exec(text);
      if (match) {
        const args = Object.fromEntries(template.names.map((name, i) => [name, match[i + 1]]));
        return this.i18n.translate(template.key, { args });
      }
    }
    return text;
  }

  /** Static entry point for code without dependency injection (filters, presenters). */
  static text(text: string): string;
  static text(text: string | null | undefined): string | null | undefined;
  static text(text: string | null | undefined) {
    if (!text || !Localize.instance) return text;
    return Localize.instance.translate(text);
  }
}
