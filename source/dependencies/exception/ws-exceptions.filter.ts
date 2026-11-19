import { Catch, HttpException, Logger, type ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';

import { Localize } from '../language/index.js';

export interface WsErrorPayload {
  status: 'error';
  statusCode: number;
  message: string | string[];
  event: string;
}

const localize = (message: unknown): string | string[] =>
  Array.isArray(message) ? message.map((m) => (typeof m === 'string' ? Localize.text(m) : String(m))) : Localize.text(String(message));

@Catch()
export class WsExceptionsFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ws = host.switchToWs();
    const payload: WsErrorPayload = { status: 'error', event: ws.getPattern(), ...this.describe(exception) };
    const ack = host
      .getArgs()
      .slice(2)
      .find((arg): arg is (body: unknown) => void => typeof arg === 'function');
    if (ack) ack(payload);
    else ws.getClient<Socket>().emit('exception', payload);
  }

  private describe(exception: unknown): Pick<WsErrorPayload, 'statusCode' | 'message'> {
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      const message = typeof body === 'object' && body !== null && 'message' in body ? body.message : body;
      return { statusCode: exception.getStatus(), message: localize(message) };
    }
    if (exception instanceof WsException) {
      const error = exception.getError();
      const message = typeof error === 'object' && error !== null && 'message' in error ? error.message : error;
      const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 400;
      return { statusCode, message: localize(message) };
    }
    this.logger.error(exception instanceof Error ? exception.stack : exception);
    return { statusCode: 500, message: Localize.text('Internal server error') };
  }
}
