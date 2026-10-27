
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, of, tap } from 'rxjs';
import { CacheService } from '../service/cache.service.js';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger();

  constructor(
    private readonly cacheService: CacheService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    if (request.method !== 'GET') {
      return next.handle();
    }

    const key = `http-cache:${request.originalUrl}`;

    try {
      const cached = await this.cacheService.getCache({ key });

      if (cached !== null && cached !== undefined) {
        response.setHeader('X-Cache', 'HIT');
        return of(cached);
      }
    } catch (error) {
      this.logger.warn('Cache read failed; continuing without cache');
    }

    response.setHeader('X-Cache', 'MISS');

    return next.handle().pipe(
      tap((data) => {
        if (response.statusCode === 200 && data !== undefined) {
          void this.cacheService
            .setCache({
              key,
              value: data,
              options: { EX: 60 },
            })
            .catch(() => {
              this.logger.warn('Cache write failed');
            });
        }
      }),
    );
  }
}
