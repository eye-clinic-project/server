import { SetMetadata } from '@nestjs/common';

export const requestTimeoutName = 'REQUEST_TIMEOUT_MS';
/** Overrides the default 10s request timeout for a route. */
export const RequestTimeout = (ms: number) => SetMetadata(requestTimeoutName, ms);
