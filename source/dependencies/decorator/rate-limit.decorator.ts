import { SkipThrottle, Throttle } from '@nestjs/throttler';

export interface RateLimitOptions {
  limit: number;
  ttl: number;
  block?: number;
}

export const RateLimit = ({ limit, ttl, block }: RateLimitOptions): MethodDecorator & ClassDecorator =>
  Throttle({ default: { limit, ttl, ...(block === undefined ? {} : { blockDuration: block }) } });

export const SkipRateLimit = (): MethodDecorator & ClassDecorator => SkipThrottle({ default: true });
