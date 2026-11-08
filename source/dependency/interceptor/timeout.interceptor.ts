import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      timeout(10000),
      catchError((error: unknown) => {
        if (error instanceof TimeoutError) {
          const requestType = context.getType<string>();

          if (requestType === 'graphql') {
            const gqlContext = GqlExecutionContext.create(context);
            const info = gqlContext.getInfo();
            void info;
          }

          return throwError(
            () => new RequestTimeoutException('Request timed out'),
          );
        }

        return throwError(() => error);
      }),
    );
  }
}
