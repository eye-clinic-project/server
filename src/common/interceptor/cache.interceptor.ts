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
import type { IAuthReq } from '../interface/ctx.interface.js';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(private readonly cacheService: CacheService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request & Partial<IAuthReq>>();
    const response = httpContext.getResponse<Response>();

    if (
      request.method !== 'GET' ||
      request.headers.authorization ||
      request.credentials
    ) {
      return next.handle();
    }

    const language = request.headers['accept-language'] ?? 'default';
    const key = `http-cache:${language}:${request.originalUrl}`;

    try {
      const cached = await this.cacheService.getCache({ key });

      if (cached !== null && cached !== undefined) {
        response.setHeader('X-Cache', 'HIT');
        return of(cached);
      }
    } catch {
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
