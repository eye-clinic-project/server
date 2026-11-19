import type { ThrottlerModuleOptions } from '@nestjs/throttler';

export function createThrottlerOptions(): ThrottlerModuleOptions {
  return {
    throttlers: [{ ttl: 60_000, limit: parseInt(process.env.THROTTLE_LIMIT ?? '', 10) || 120 }],
    skipIf: () => process.env.THROTTLE_DISABLED === 'true',
  };
}
