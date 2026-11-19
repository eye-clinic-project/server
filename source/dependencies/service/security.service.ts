import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (password: string, salt: string, keylen: number) => Promise<Buffer>;

const ALGORITHM = 'aes-256-ctr';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

@Injectable()
export class SecurityService implements OnModuleInit {
  private key: Buffer;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const password = this.configService.getOrThrow<string>('app.security.encryptionKey');
    const salt = this.configService.getOrThrow<string>('app.security.encryptionSecretKey');
    this.key = await scryptAsync(password, salt, KEY_LENGTH);
  }

  encrypt(textToEncrypt: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encryptedText = Buffer.concat([cipher.update(textToEncrypt, 'utf8'), cipher.final()]);
    return `${iv.toString('hex')}:${encryptedText.toString('hex')}`;
  }

  decrypt(payload: string): string {
    const [ivHex, encryptedHex] = payload.split(':');
    if (!ivHex || encryptedHex === undefined) throw new Error('Malformed encrypted value');

    const iv = Buffer.from(ivHex, 'hex');
    if (iv.length !== IV_LENGTH) throw new Error('Malformed encrypted value');

    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    const decryptedText = Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]);
    return decryptedText.toString('utf8');
  }
}
