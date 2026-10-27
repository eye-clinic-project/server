import { Global, Module } from '@nestjs/common';
import { UtilService } from './util.service.js';

@Module({
  providers: [UtilService],
  exports: [UtilService],
})
export class MailModule {}
