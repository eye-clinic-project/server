import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: Transporter;

  constructor(private readonly configService: ConfigService) {}

  get isConfigured(): boolean {
    return !!(this.configService.get<string>('mail.host') && this.configService.get<string>('mail.from'));
  }

  private get isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  private getTransporter(): Transporter {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException('Email delivery is not configured');
    }
    if (!this.transporter) {
      const user = this.configService.get<string>('mail.user');
      const password = this.configService.get<string>('mail.password');
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('mail.host'),
        port: this.configService.get<number>('mail.port', 587),
        secure: this.configService.get<boolean>('mail.secure', false),
        ...(user && password ? { auth: { user, pass: password } } : {}),
      });
    }
    return this.transporter;
  }

  async send({ to, subject, text, html }: { to: string; subject: string; text: string; html: string }): Promise<void> {
    if (!this.isConfigured && !this.isProduction) {
      // Development without SMTP: log instead of failing so flows can be tested.
      this.logger.warn(`[mail disabled] to=${to} subject="${subject}"\n${text}`);
      return;
    }
    await this.getTransporter().sendMail({
      from: this.configService.get<string>('mail.from'),
      to,
      subject,
      text,
      html,
    });
  }

  private layout(title: string, body: string): string {
    return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0f172a">
<h2 style="color:#0e7490">RetinaCare</h2><h3>${escapeHtml(title)}</h3>${body}
<p style="color:#64748b;font-size:12px;margin-top:24px">This is an automated message. Please do not reply.</p></div>`;
  }

  async sendVerificationCode(email: string, code: number): Promise<void> {
    await this.send({
      to: email,
      subject: 'Verify your email address',
      text: `Your email verification code is ${code}. It expires in 10 minutes.`,
      html: this.layout(
        'Verify your email address',
        `<p>Your verification code is <strong style="font-size:20px;letter-spacing:4px">${code}</strong></p><p>It expires in 10 minutes.</p>`,
      ),
    });
  }

  async sendPasswordResetToken(email: string, token: string, link: string, minutes: number): Promise<void> {
    await this.send({
      to: email,
      subject: 'Reset your password',
      text: `Reset your password using this link (valid for ${minutes} minutes, single use): ${link}\nToken: ${token}`,
      html: this.layout(
        'Reset your password',
        `<p><a href="${escapeHtml(link)}">Click here to reset your password</a>.</p><p>The link works once and expires in ${minutes} minutes. If you did not request this, ignore this email.</p>`,
      ),
    });
  }

  async sendInvitation(email: string, doctorName: string, link: string): Promise<void> {
    await this.send({
      to: email,
      subject: 'Your RetinaCare account is ready',
      text: `Dr. ${doctorName} created a RetinaCare account for you. Set your password here: ${link}`,
      html: this.layout(
        'Your account is ready',
        `<p>Dr. ${escapeHtml(doctorName)} created a RetinaCare account for you.</p><p><a href="${escapeHtml(link)}">Set your password</a> to sign in.</p>`,
      ),
    });
  }

  /**
   * Notification email (FR4.6). Deliberately contains NO medical details,
   * only a generic title and a link to log in.
   */
  async sendNotification(email: string, name: string, title: string, loginLink: string): Promise<void> {
    await this.send({
      to: email,
      subject: title,
      text: `Hello ${name},\n\n${title}. Please log in to RetinaCare to view it: ${loginLink}`,
      html: this.layout(
        title,
        `<p>Hello ${escapeHtml(name)},</p><p>You have a new update in RetinaCare. For your privacy, details are only available after you log in.</p><p><a href="${escapeHtml(loginLink)}">Log in to view</a></p>`,
      ),
    });
  }
}
