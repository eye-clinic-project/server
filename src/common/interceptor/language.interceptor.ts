import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';

import { LanguageRequest } from '../interface/interceptor.interface.js';
import { IAuthReq } from '../interface/ctx.interface.js';

@Injectable()
export class LanguageInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    let req: LanguageRequest;

    switch (context.getType<string>()) {
      case 'http':
        req = context.switchToHttp().getRequest<LanguageRequest>();
        break;

      case 'graphql':
        req = GqlExecutionContext.create(context).getContext<{
          req: IAuthReq;
        }>().req as LanguageRequest;
        break;

      default:
        return next.handle();
    }

    req.headers['accept-language'] ??= req.credentials?.user?.lang ?? 'en';

    return next.handle();
  }
}
