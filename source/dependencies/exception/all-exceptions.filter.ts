import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Localize } from '../language/localize.js';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'http' || !(exception instanceof HttpException)) {
      return super.catch(exception, host);
    }
    const body = exception.getResponse();
    const translated =
      typeof body === 'string'
        ? Localize.text(body)
        : {
            ...body,
            ...('message' in body
              ? {
                  message: Array.isArray(body.message)
                    ? body.message.map((m: unknown) => (typeof m === 'string' ? Localize.text(m) : m))
                    : typeof body.message === 'string'
                      ? Localize.text(body.message)
                      : body.message,
                }
              : {}),
            ...('error' in body && typeof body.error === 'string' ? { error: Localize.text(body.error) } : {}),
          };
    return super.catch(new HttpException(translated, exception.getStatus(), { cause: exception }), host);
  }
}
