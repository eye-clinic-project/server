import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { CacheService } from '../service/cache.service.js';

const logger = new Logger('Redis');

const redisClient = {
  provide: 'REDIS_CLIENT',
  inject: [ConfigService],
  useFactory: (configService: ConfigService): Redis => {
    const uri = configService.get<string>('redis.uri');
    const client = uri
      ? new Redis(uri)
      : new Redis({
          host: configService.getOrThrow<string>('redis.host'),
          port: configService.getOrThrow<number>('redis.port'),
        });

    client.on('connect', () => logger.log('connected'));
    client.on('ready', () => logger.log('ready'));
    client.on('error', (error: Error) =>
      logger.error(error.message, error.stack),
    );

    return client;
  },
};

@Global()
@Module({
  imports: [ConfigModule],
  providers: [redisClient, CacheService],
  exports: [redisClient, CacheService],
})
export class CacheModule {}
