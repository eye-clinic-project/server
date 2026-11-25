import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class ChatMiddleware implements NestMiddleware {
  private readonly logger = new Logger('Chat');

  use(req: Request, res: Response, next: NextFunction) {
    const start = performance.now();

    res.on('finish', () => {
      this.logger.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${(performance.now() - start).toFixed(2)}ms`);
    });

    next();
  }
}
