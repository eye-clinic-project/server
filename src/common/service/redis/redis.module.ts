import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis, type RedisOptions } from 'ioredis';
import { RedisService } from './redis.service.js';

const logger = new Logger('Redis');

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const options: RedisOptions = {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => Math.min(times * 100, 3000),
        };
        const url = config.get<string>('redis.url');
        const client = url
          ? new Redis(url, options)
          : new Redis({
              host: config.getOrThrow<string>('redis.host'),
              port: config.getOrThrow<number>('redis.port'),
              ...options,
            });

        client.on('connect', () => logger.log('connected'));
        client.on('reconnecting', () => logger.warn('reconnecting'));
        client.on('error', (err) => logger.error(err.message));

        return client;
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
