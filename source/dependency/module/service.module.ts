import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { LoggerService } from '../service/logger.service.js';
import { MailService } from '../service/mail.service.js';
import { SecurityService } from '../service/security.service.js';
import { TokenService } from '../service/token.service.js';
import { StorageService } from '../service/storage.service.js';
import { UtilService } from '../service/util.service.js';
import { AiService } from '../service/ai.service.js';
import { AccessService } from '../service/access.service.js';
import { NotifierService } from '../service/notifier.service.js';
import { RealtimeService } from '../service/realtime.service.js';
import { PdfService } from '../service/pdf.service.js';
import { ProfileService } from '../service/profile.service.js';
import { Localize } from '../language/localize.js';
import { CacheModule } from './cache.module.js';

const services = [
  LoggerService,
  MailService,
  TokenService,
  StorageService,
  SecurityService,
  UtilService,
  AiService,
  AccessService,
  NotifierService,
  RealtimeService,
  PdfService,
  ProfileService,
  Localize,
];

@Global()
@Module({
  imports: [ConfigModule, JwtModule.register({}), CacheModule],
  providers: services,
  exports: services,
})
export class ServiceModule {}
