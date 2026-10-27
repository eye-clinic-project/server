
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request } from 'express';


import { RATE_LIMIT_KEY } from '../decorator/limit.decorator.js';
import { CacheService } from '../service/cache.service.js';
import { RateLimitOptions } from '../interface/decorator.interface.js';
import { CtxType, IAuthReq, IAuthSocket } from '../interface/ctx.interface.js';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    let key: string;

    switch (context.getType<CtxType>()) {
      case 'http': {
        const request = context.switchToHttp().getRequest<Request>();

        const ip = request.ip ?? 'unknown';
        const route = request.route?.path ?? request.path;

        key = `rate-limit:${ip}:${request.method}:${route}`;
        break;
      }

      case 'graphql': {
        const gqlContext = GqlExecutionContext.create(context);
        const request = gqlContext.getContext<{ req: IAuthReq }>().req;
        const info = gqlContext.getInfo();

        const ip = request?.ip ?? 'unknown';
        const operation = info.fieldName;

        key = `rate-limit:${ip}:graphql:${operation}`;
        break;
      }

      case 'ws': {
        const client = context.switchToWs().getClient<IAuthSocket>();

        const ip =
          client.handshake?.address ??
          client.conn?.remoteAddress ??
          'unknown';

        const pattern = context.switchToWs().getPattern();

        key = `rate-limit:${ip}:ws:${pattern}`;
        break;
      }

      default:
        return true;
    }

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
