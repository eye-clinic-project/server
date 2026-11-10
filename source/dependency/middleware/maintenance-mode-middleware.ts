import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import { Localize } from '../language/localize.js';

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const maintenance = this.configService.get<boolean>('app.maintenance', false);

    if (maintenance) {
      return res.status(503).json({
        message: Localize.text('Server is under maintenance'),
      });
    }

    next();
  }
}
