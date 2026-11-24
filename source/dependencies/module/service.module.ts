import { Module } from '@nestjs/common';

import { LoggerService } from '../service/logger.service.js';
import { MailService, OtpMail } from '../service/mail.service.js';
import { NotificationService } from '../service/notification.service.js';
import { OtpService } from '../service/otp.service.js';
import { PdfService } from '../service/pdf.service.js';
import { SecurityService } from '../service/security.service.js';
import { DatabaseModule } from './database.module.js';

@Module({
  imports: [DatabaseModule],
  providers: [LoggerService, SecurityService, OtpService, MailService, NotificationService, OtpMail, PdfService],
  exports: [LoggerService, SecurityService, OtpService, MailService, NotificationService, PdfService],
})
export class ServiceModule {}
