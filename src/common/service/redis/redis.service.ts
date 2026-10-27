import type {
  SetCache,
  CacheKey,
  ExpireCache,
  IncrementCache,
  FindCacheKeys,
  DeleteManyCache,
  GetOrSetCache,
  RateLimit,
  RateLimitResult,
} from '../../interface/redis.interface.js';

import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';



const INCR_WITH_TTL = `
local v = redis.call('INCRBY', KEYS[1], ARGV[1])
if v == tonumber(ARGV[1]) and tonumber(ARGV[2]) > 0 then
  redis.call('EXPIRE', KEYS[1], ARGV[2])
end
return v`;

const RATE_LIMIT = `
local c = redis.call('INCR', KEYS[1])
if c == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('TTL', KEYS[1])
if ttl < 0 then redis.call('EXPIRE', KEYS[1], ARGV[1]); ttl = tonumber(ARGV[1]) end
return { c, ttl }`;

export const RedisKeys = {
  otpKey: (email: string) => `otp:${email.toLowerCase()}`,
  rateLimitKey: (scope: string, id: string) => `rate:${scope}:${id}`,
  userToken: (userId: string, jti: string) =>
    `auth:token:${userId}:${jti}`,
  userTokens: (userId: string) => `auth:token:${userId}:*`,
} as const;

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly cacheClient: Redis,
  ) {}

  async onModuleDestroy() {
    await this.cacheClient.quit();
  }

  private serialize(value: unknown): string {
    const json = JSON.stringify(value);
    if (json === undefined) {
      throw new TypeError('Cannot cache undefined, functions or symbols');
    }
    return json;
  }

  private deserialize<T>(raw: string): T {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  async setCache<T = unknown>({ key, value, options = {} }: SetCache<T>): Promise<boolean> {
    const { EX, PX, NX, XX, KEEPTTL } = options;

    const ttlOptions = [EX !== undefined, PX !== undefined, !!KEEPTTL].filter(Boolean);
    if (ttlOptions.length > 1) {
      throw new Error('EX, PX and KEEPTTL are mutually exclusive');
    }
    if (NX && XX) {
      throw new Error('NX and XX are mutually exclusive');
    }

    const args: (string | number)[] = [];
    if (EX !== undefined) args.push('EX', EX);
    if (PX !== undefined) args.push('PX', PX);
    if (KEEPTTL) args.push('KEEPTTL');
    if (NX) args.push('NX');
    if (XX) args.push('XX');

    const result = await this.cacheClient.call('SET', key, this.serialize(value), ...args);
    return result === 'OK';
  }

  async getCache<T = unknown>({ key }: CacheKey): Promise<T | null> {
    const value = await this.cacheClient.get(key);
    return value !== null ? this.deserialize<T>(value) : null;
  }

  async getAndDelete<T = unknown>({ key }: CacheKey): Promise<T | null> {
    const value = await this.cacheClient.getdel(key);
    return value !== null ? this.deserialize<T>(value) : null;
  }

  async deleteCache({ key }: CacheKey): Promise<number> {
    return this.cacheClient.del(key);
  }

  async deleteMany({ keys }: DeleteManyCache): Promise<number> {
    if (!keys.length) return 0;
    return this.cacheClient.unlink(...keys);
  }

  async cacheExists({ key }: CacheKey): Promise<boolean> {
    return (await this.cacheClient.exists(key)) > 0;
  }

  async expireCache({ key, seconds }: ExpireCache): Promise<boolean> {
    return (await this.cacheClient.expire(key, seconds)) === 1;
  }

  async getTTL({ key }: CacheKey): Promise<number> {
    return this.cacheClient.ttl(key);
  }

  async persistCache({ key }: CacheKey): Promise<boolean> {
    return (await this.cacheClient.persist(key)) === 1;
  }

  async incrementCache({ key, amount = 1, ttl = 0 }: IncrementCache): Promise<number> {
    if (ttl > 0) {
      return (await this.cacheClient.eval(INCR_WITH_TTL, 1, key, amount, ttl)) as number;
    }
    return this.cacheClient.incrby(key, amount);
  }

  async decrementCache({ key, amount = 1 }: IncrementCache): Promise<number> {
    return this.cacheClient.decrby(key, amount);
  }


  async getOrSet<T>({ key, ttl, factory }: GetOrSetCache<T>): Promise<T> {
    const cached = await this.getCache<T>({ key });
    if (cached !== null) return cached;

    const fresh = await factory();
    await this.setCache({ key, value: fresh, options: { EX: ttl } });
    return fresh;
  }

  async rateLimit({ key, limit, windowSeconds }: RateLimit): Promise<RateLimitResult> {
    const [count, ttl] = (await this.cacheClient.eval(
      RATE_LIMIT,
      1,
      key,
      windowSeconds,
    )) as [number, number];

    const allowed = count <= limit;
    return {
      allowed,
      remaining: Math.max(0, limit - count),
      retryAfter: allowed ? 0 : Math.max(0, ttl),
    };
  }


  async findCacheKeys({ pattern = '*', count = 100 }: FindCacheKeys = {}): Promise<string[]> {
    const keys = new Set<string>(); 
    const stream = this.cacheClient.scanStream({ match: pattern, count });

    for await (const batch of stream as AsyncIterable<string[]>) {
      batch.forEach((k) => keys.add(k));
    }
    return [...keys];
  }

  async deleteByPattern({ pattern }: Required<Pick<FindCacheKeys, 'pattern'>>): Promise<number> {
    let deleted = 0;
    const stream = this.cacheClient.scanStream({ match: pattern, count: 200 });

    for await (const batch of stream as AsyncIterable<string[]>) {
      if (batch.length) deleted += await this.cacheClient.unlink(...batch);
    }
    this.logger.debug(`Deleted ${deleted} keys matching "${pattern}"`);
    return deleted;
  }
}