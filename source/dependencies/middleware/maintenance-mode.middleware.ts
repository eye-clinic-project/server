import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import { Localize } from '../language/localize.js';
import { SUPPORTED_LOCALES } from '../language/i18n.constants.js';

const supported = (value: unknown): string | undefined => {
  const lang = typeof value === 'string' ? value.trim().slice(0, 2).toLowerCase() : undefined;
  return lang && (SUPPORTED_LOCALES as readonly string[]).includes(lang) ? lang : undefined;
};

const languageOf = (req: Request): string | undefined =>
  supported(req.query.language) ?? supported(req.headers['x-language']) ?? supported(req.headers['accept-language']?.split(',')[0]);

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const maintenance = this.configService.get<boolean>('app.maintenanceMode', false);

    if (maintenance && req.path !== '/ping') {
      return res.status(503).json({ message: Localize.text('Server is under maintenance', languageOf(req)) });
    }

    next();
  }
}
