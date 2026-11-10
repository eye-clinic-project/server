import { hours, minutes, Throttle } from '@nestjs/throttler';

const limit = (max: number, ttl: number, blockDuration?: number) =>
  Throttle({
    default: { limit: max, ttl, ...(blockDuration ? { blockDuration } : {}) },
  });

export const RateLimit = {
  signUp: () => limit(3, hours(1), hours(5)),

  login: () => limit(5, minutes(1), hours(5)),

  authAttempt: () => limit(5, minutes(1), hours(1)),

  verificationEmail: () => limit(3, hours(1), hours(5)),

  passwordResetRequest: () => limit(3, minutes(1), hours(1)),

  session: () => limit(10, minutes(1), minutes(15)),

  passwordCheck: () => limit(5, minutes(15), hours(1)),

  sensitive: () => limit(5, hours(1), hours(1)),

  aiInference: () => limit(10, minutes(1), minutes(5)),

  upload: () => limit(20, minutes(1), minutes(5)),

  fileGeneration: () => limit(10, minutes(1)),

  outboundEmail: () => limit(10, minutes(10), minutes(30)),

  create: () => limit(30, minutes(1)),

  message: () => limit(60, minutes(1), minutes(2)),

  search: () => limit(60, minutes(1)),

  adminWrite: () => limit(30, minutes(1)),
};
