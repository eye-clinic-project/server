export interface CacheKey {
  key: string;
}

export interface SetCacheOptions {
  /** Expire after N seconds */
  EX?: number;
  /** Expire after N milliseconds */
  PX?: number;
  /** Only set if the key does not exist */
  NX?: boolean;
  /** Only set if the key already exists */
  XX?: boolean;
  /** Keep the existing TTL */
  KEEPTTL?: boolean;
}

export interface SetCache<T = unknown> extends CacheKey {
  value: T;
  options?: SetCacheOptions;
}

export interface ExpireCache extends CacheKey {
  seconds: number;
}

export interface IncrementCache extends CacheKey {
  amount?: number;
  ttl?: number;
}

export interface FindCacheKeys {
  pattern?: string;
  count?: number;
}

export interface DeleteManyCache {
  keys: string[];
}

export interface GetOrSetCache<T> extends CacheKey {
  ttl: number;
  factory: () => Promise<T>;
}

export interface RateLimit extends CacheKey {
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}
