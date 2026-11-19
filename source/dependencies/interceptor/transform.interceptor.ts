import { Injectable, NestInterceptor, ExecutionContext, CallHandler, StreamableFile } from '@nestjs/common';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Localize } from '../language/index.js';

export interface Response<T> {
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T> | StreamableFile> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T> | StreamableFile> {
    return next.handle().pipe(map((data: T) => (data instanceof StreamableFile ? data : { message: Localize.text('Request completed successfully'), data })));
  }
}
