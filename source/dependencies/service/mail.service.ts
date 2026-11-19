import { Injectable } from '@nestjs/common';
import { Mailer, html, type Mailable } from '@nestjs/mail';
import { OtpPurpose } from '../enum/index.js';

export interface OtpMailData {
  purpose: OtpPurpose;
  code: string;
  expiresInMinutes: number;
}

@Injectable()
export class OtpMail implements Mailable<OtpMailData> {
  render({ purpose, code, expiresInMinutes }: OtpMailData) {
    const isReset = purpose === OtpPurpose.PASSWORD_RESET;
    return {
      subject: isReset ? 'Your RetinaCare password reset code' : 'Verify your RetinaCare email',
      html: html`
        <p>${isReset ? 'Use this code to reset your password:' : 'Use this code to verify your email address:'}</p>
        <p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p>
        <p>The code expires in ${expiresInMinutes} minutes. If you didn't request it, you can ignore this email.</p>
      `,
    };
  }
}

@Injectable()
export class MailService {
  constructor(private readonly mailer: Mailer) {}

  async sendOtp(to: string, data: OtpMailData): Promise<void> {
    await this.mailer.send(OtpMail, { to, data });
  }
}
