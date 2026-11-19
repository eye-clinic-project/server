import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER, type Cache } from '@nestjs/cache-manager';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

import { OtpPurpose } from '../enum/index.js';
import { MailService } from './mail.service.js';

const otpKey = (purpose: OtpPurpose, email: string): string => `auth:otp:${purpose}:${email.trim().toLowerCase()}`;

@Injectable()
export class OtpService {
  private readonly secret: string;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    this.secret = configService.getOrThrow<string>('app.security.encryptionSecretKey');
  }

  readonly ttlMs = 10 * 60_000;

  async issue(purpose: OtpPurpose, email: string): Promise<string> {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.cacheManager.set(this.key(purpose, email), this.hash(purpose, email, code), this.ttlMs);
    return code;
  }

  async verify(purpose: OtpPurpose, email: string, code: string): Promise<boolean> {
    const key = this.key(purpose, email);
    const stored = await this.cacheManager.get<string>(key);
    if (!stored) return false;

    const expected = Buffer.from(stored, 'hex');
    const actual = Buffer.from(this.hash(purpose, email, code), 'hex');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;

    await this.cacheManager.del(key);
    return true;
  }

  private key(purpose: OtpPurpose, email: string): string {
    return otpKey(purpose, email);
  }

  private hash(purpose: OtpPurpose, email: string, code: string): string {
    return createHmac('sha256', this.secret).update(`${purpose}:${email.trim().toLowerCase()}:${code}`).digest('hex');
  }

  async sendOtp(purpose: OtpPurpose, email: string): Promise<void> {
    const code = await this.issue(purpose, email);
    await this.mailService.sendOtp(email, { purpose, code, expiresInMinutes: this.ttlMs / 60_000 });
  }
}
