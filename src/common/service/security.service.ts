import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SecurityService  {
  private readonly saltRounds = 12;
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const key = this.configService.get<string>('encryption.key');

    if (!key) {
      throw new InternalServerErrorException('ENCRYPTION_KEY is missing');
    }

    this.key = Buffer.from(key, 'base64');

    if (this.key.length !== 32) {
      throw new InternalServerErrorException(
        'ENCRYPTION_KEY must decode to 32 bytes',
      );
    }
  }

  encrypt(value: string): string {
    const iv = randomBytes(12);

    const cipher = createCipheriv(this.algorithm, this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }

  decrypt(encryptedValue: string): string {
    const parts = encryptedValue.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted value');
    }

    const [ivString, authTagString, dataString] = parts;

    const iv = Buffer.from(ivString, 'base64');
    const authTag = Buffer.from(authTagString, 'base64');
    const encrypted = Buffer.from(dataString, 'base64');

    if (iv.length !== 12 || authTag.length !== 16) {
      throw new Error('Invalid encrypted value');
    }

    const decipher = createDecipheriv(this.algorithm, this.key, iv);

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  async hash(value: string): Promise<string> {
    return bcrypt.hash(value, this.saltRounds);
  }

  async compare(value: string, hashedValue: string): Promise<boolean> {
    return bcrypt.compare(value, hashedValue);
  }
}
