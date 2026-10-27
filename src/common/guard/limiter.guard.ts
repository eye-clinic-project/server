import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { RATE_LIMIT_KEY } from '../decorator/limit.decorator.js';
import { RedisService } from '../service/redis/redis.service.js';
import { RateLimitOptions } from '../interface/decorator.interface.js';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    const ip = request.ip ?? 'unknown';
    const key = `rate-limit:${ip}:${request.method}:${request.route?.path ?? request.path}`;

    const count = await this.cacheService.incrementCache({
      key,
      ttl: options.ttl,
    });

    if (count > options.limit) {
      throw new HttpException(
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
