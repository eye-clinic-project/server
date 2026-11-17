import { SetMetadata } from '@nestjs/common';

export const requestTimeoutName = 'REQUEST_TIMEOUT_MS';
export const RequestTimeout = (ms: number) => SetMetadata(requestTimeoutName, ms);
