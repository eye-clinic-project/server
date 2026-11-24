import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

import { OtpService } from '../../../dependencies/service/otp.service.js';
import { OtpPurpose } from '../../../dependencies/enum/security.enum.js';

export const AUTHENTICATION_QUEUE = 'authentication';

export enum AuthenticationJob {
  SEND_OTP = 'send-otp',
}

export interface SendOtpJob {
  purpose: OtpPurpose;
  email: string;
}

@Processor(AUTHENTICATION_QUEUE)
export class AuthenticationProcessor extends WorkerHost {
  constructor(private readonly otpService: OtpService) {
    super();
  }

  async process(job: Job<SendOtpJob>): Promise<void> {
    switch (job.name) {
      case AuthenticationJob.SEND_OTP:
        await this.otpService.sendOtp(job.data.purpose, job.data.email);
        break;
    }
  }
}
