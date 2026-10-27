import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../service/logger.service.js';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.originalUrl ?? req.url;
    const startedAt = Date.now();

    this.logger.log(`Incoming: ${method} ${url}`);

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            `Completed: ${method} ${url} - ${Date.now() - startedAt}ms`,
          );
        },
        error: (error: unknown) => {
          this.logger.error(
            `Failed: ${method} ${url} - ${Date.now() - startedAt}ms`,
          );
        },
      }),
    );
  }
}
