import { Module } from '@nestjs/common';
import { LoggerService } from './logger.service.js';
import { UserModule } from '../../../module/user/user.module.js';

@Module({
  exports: [LoggerService],
  providers: [LoggerService],
})
export class LoggerModule {}
