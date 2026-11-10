import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class SlowRequestMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = performance.now();

    res.on('finish', () => {
      const duration = performance.now() - start;

      if (duration > 1000) {
        console.warn(`SLOW REQUEST: ${req.method} ${req.url} - ${duration.toFixed(2)}ms`);
      }
    });

    next();
  }
}
