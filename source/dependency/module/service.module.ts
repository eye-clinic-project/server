import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { LoggerService } from '../service/logger.service.js';
import { MailService } from '../service/mail.service.js';
import { SecurityService } from '../service/security.service.js';
import { TokenService } from '../service/token.service.js';
import { UploadService } from '../service/upload.service.js';
import { UtilService } from '../service/util.service.js';
import { CacheModule } from './cache.module.js';
import { UserRepository } from '../../database/repository/user.repository.js';

const services = [
  LoggerService,
  MailService,
  TokenService,
  UploadService,
  SecurityService,
  UtilService,
  LoggerService,
];

@Global()
@Module({
  imports: [ConfigModule, JwtModule.register({}), CacheModule],
  providers: [UserRepository, ...services],
  exports: [...services, UserRepository],
})
export class ServiceModule {}
