import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { LoggerService } from '../service/logger.service.js';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = Date.now();

    let method: string;
    let url: string;

    switch (context.getType<string>()) {
      case 'http': {
        const req = context.switchToHttp().getRequest();

        method = req.method;
        url = req.originalUrl ?? req.url;
        break;
      }

      case 'graphql': {
        const gqlContext = GqlExecutionContext.create(context);
        const info = gqlContext.getInfo();

        method = info.operation.operation.toUpperCase();
        url = info.fieldName;
        break;
      }

      case 'ws': {
        const wsContext = context.switchToWs();
        const data = wsContext.getData();

        method = 'WS';
        url =
          typeof data?.event === 'string'
            ? data.event
            : context.getHandler().name;
        break;
      }

      default:
        method = context.getType<string>();
        url = context.getHandler().name;
    }

    this.logger.log(`Incoming: ${method} ${url}`);

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            `Completed: ${method} ${url} - ${Date.now() - startedAt}ms`,
          );
        },
        error: () => {
          this.logger.error(
            `Failed: ${method} ${url} - ${Date.now() - startedAt}ms`,
          );
        },
      }),
    );
  }
}
