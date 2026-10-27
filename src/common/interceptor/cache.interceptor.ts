import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestMethod,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { RedisService } from '../service/redis/redis.service.js';


@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: RedisService,
    private readonly reflector: Reflector,
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

    if (response.statusCode !== 200) {
      return next.handle();
    }

    const key = `http-cache:${request.originalUrl}`;

    const cached = await this.cacheService.getCache({key});

    if (cached !== null && cached !== undefined) {
      response.setHeader('X-Cache', 'HIT');
      return of(cached);
    }

    response.setHeader('X-Cache', 'MISS');

    return next.handle().pipe(
      tap((data) => {
        if (data !== undefined) {
          void this.cacheService.setCache({
            key,
            value: data,
            options: {
                EX : 60 
            },
          });
        }
      }),
    );
  }
}