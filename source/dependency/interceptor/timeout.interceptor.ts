import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { requestTimeoutName } from '../decorator/timeout.decorator.js';

const DEFAULT_TIMEOUT_MS = 10_000;

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType<string>() === 'ws') {
      return next.handle();
    }
    const ms =
      this.reflector.getAllAndOverride<number | undefined>(requestTimeoutName, [
        context.getHandler(),
        context.getClass(),
      ]) ?? DEFAULT_TIMEOUT_MS;

    return next.handle().pipe(
      timeout(ms),
      catchError((error: unknown) => {
        if (error instanceof TimeoutError) {
          return throwError(
            () => new RequestTimeoutException('Request timed out'),
          );
        }
        return throwError(() => error);
      }),
    );
  }
}
