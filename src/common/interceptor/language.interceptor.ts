
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { LanguageRequest } from './interface/interceptor.type.js';



@Injectable()
export class LanguageInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const req = context
      .switchToHttp()
      .getRequest<LanguageRequest>();

    req.headers['accept-language'] ??=
      req.credentials?.user?.lang ?? 'en';

    return next.handle();
  }
}
