import { Module } from '@nestjs/common';

import { LoggerService, MailService, OtpMail, NotificationService, OtpService, PdfService, SecurityService } from '../service/index.js';
import { DatabaseModule } from './database.module.js';

@Module({
  imports: [DatabaseModule],
  providers: [LoggerService, SecurityService, OtpService, MailService, NotificationService, OtpMail, PdfService],
  exports: [LoggerService, SecurityService, OtpService, MailService, NotificationService, PdfService],
})
export class ServiceModule {}
