import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CacheModuleOptions } from '@nestjs/cache-manager';
import { Keyv } from 'keyv';
import KeyvRedis, { createKeyv } from '@keyv/redis';
import { KeyvCacheableMemory } from 'cacheable';

export async function createCacheOptions(config: ConfigService): Promise<CacheModuleOptions> {
  const logger = new Logger('REDIS');
  const redisStore = createKeyv(config.get<string>('REDIS_URL') ?? 'redis://localhost:6379');
  const redisAdapter = redisStore.store as KeyvRedis<unknown>;

  redisAdapter.on('error', (error) => logger.error('Redis error', error));
  redisAdapter.on('connect', () => logger.log('Redis connected'));
  redisAdapter.on('reconnecting', () => logger.warn('Redis reconnecting...'));
  redisAdapter.on('disconnect', () => logger.warn('Redis disconnected'));
  redisAdapter.client.on('ready', () => logger.log('Redis is ready'));
  redisAdapter.client.on('end', () => logger.warn('Redis connection closed'));

  const client = await redisAdapter.getClient();
  logger.log(`Redis health check: ${await client.ping()}`);

  return {
    stores: [new Keyv({ store: new KeyvCacheableMemory({ ttl: 60_000, lruSize: 5_000 }) }), redisStore],
  };
}
