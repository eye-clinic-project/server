import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { LoggerService } from '../../../dependencies/service/logger.service.js';
import { OtpPurpose } from '../../../dependencies/enum/security.enum.js';
import { AUTHENTICATION_QUEUE, AuthenticationJob, type SendOtpJob } from '../queue/authentication.queue.js';
import { AuthenticateEmailVerificationRequestedEvent, EMAIL_VERIFICATION_REQUESTED_EVENT } from './email-verification-requested.event.js';
import { AuthenticatePasswordResetRequestedEvent, PASSWORD_RESET_REQUESTED_EVENT } from './password-reset-requested.event.js';
import { AuthenticateRegisteredEvent, USER_REGISTERED_EVENT } from './user-registered.event.js';

@Injectable()
export class AuthenticateListener {
  constructor(
    private readonly loggerService: LoggerService,
    @InjectQueue(AUTHENTICATION_QUEUE) private readonly authenticationQueue: Queue<SendOtpJob>,
  ) {}

  @OnEvent(USER_REGISTERED_EVENT)
  handleUserRegistered(event: AuthenticateRegisteredEvent): Promise<void> {
    return this.enqueueOtp(OtpPurpose.EMAIL_VERIFICATION, event.userId, event.email);
  }

  @OnEvent(EMAIL_VERIFICATION_REQUESTED_EVENT)
  handleEmailVerificationRequested(event: AuthenticateEmailVerificationRequestedEvent): Promise<void> {
    return this.enqueueOtp(OtpPurpose.EMAIL_VERIFICATION, event.userId, event.email);
  }

  @OnEvent(PASSWORD_RESET_REQUESTED_EVENT)
  handlePasswordResetRequested(event: AuthenticatePasswordResetRequestedEvent): Promise<void> {
    return this.enqueueOtp(OtpPurpose.PASSWORD_RESET, event.userId, event.email);
  }

  private async enqueueOtp(purpose: OtpPurpose, userId: string, email: string): Promise<void> {
    try {
      await this.authenticationQueue.add(
        AuthenticationJob.SEND_OTP,
        { purpose, email },
        { deduplication: { id: `${AuthenticationJob.SEND_OTP}-${purpose}-${userId}` } },
      );
    } catch (error: unknown) {
      this.loggerService.warn(error);
    }
  }
}
