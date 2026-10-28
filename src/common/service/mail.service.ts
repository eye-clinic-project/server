import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {}

  async sendVerificationCode(email: string, code: number): Promise<void> {
    const host = this.configService.get<string>('mail.host');
    const from = this.configService.get<string>('mail.from');

    if (!host || !from) {
      throw new ServiceUnavailableException('Email delivery is not configured');
    }

    const user = this.configService.get<string>('mail.user');
    const password = this.configService.get<string>('mail.password');
    const transporter = nodemailer.createTransport({
      host,
      port: this.configService.get<number>('mail.port', 587),
      secure: this.configService.get<boolean>('mail.secure', false),
      ...(user && password ? { auth: { user, pass: password } } : {}),
    });

    await transporter.sendMail({
      from,
      to: email,
      subject: 'Verify your email address',
      text: `Your email verification code is ${code}. It expires in 2 minutes.`,
      html: `<p>Your email verification code is <strong>${code}</strong>.</p><p>It expires in 2 minutes.</p>`,
    });
  }
}
