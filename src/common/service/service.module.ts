import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Redis, type RedisOptions } from 'ioredis';

import { SchemasModule } from '../../core/database/database.schema.js';
import { UserRepository } from '../../core/database/repository/user.repository.js';
import { LoggerService } from './logger.service.js';
import { MailService } from './mail.service.js';
import { CacheService } from './cache.service.js';
import { SecurityService } from './security.service.js';
import { TokenService } from './token.service.js';
import { UploadService } from './upload.service.js';
import { UtilService } from './util.service.js';

const logger = new Logger('Redis');
const services = [
  LoggerService,
  MailService,
  CacheService,
  SecurityService,
  TokenService,
  UploadService,
  UtilService,
];

@Global()
@Module({
  imports: [ConfigModule, JwtModule.register({}), SchemasModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const options: RedisOptions = {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => Math.min(times * 100, 3000),
        };
        const uri = config.get<string>('redis.uri');
        const client = uri
          ? new Redis(uri, options)
          : new Redis({
              host: config.getOrThrow<string>('redis.host'),
              port: config.getOrThrow<number>('redis.port'),
              ...options,
            });

        client.on('connect', () => logger.log('redis connected'));
        client.on('reconnecting', () => logger.warn('redis reconnecting'));
        client.on('error', (error) => logger.error(error.message));
        client.on('ready', () => logger.log("redis ready"));

        return client;
      },
    },
    UserRepository,
    ...services,
  ],
  exports: services,
})
export class ServiceModule {}
