import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

import { ApiResponse } from '../interface/interceptor.interface.js';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  T | ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<T | ApiResponse<T>> {
    if (context.getType<string>() !== 'http') {
      return next.handle();
    }

    return next.handle().pipe(
      map((data: T) =>
        data instanceof StreamableFile
          ? data
          : {
              message: 'request accepted',
              data,
            },
      ),
    );
  }
}
