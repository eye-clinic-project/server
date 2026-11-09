import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve, sep } from 'node:path';
import { SecurityService } from './security.service.js';
import { SignedUrl } from '../presenter.js';

/**
 * Private file storage for medical images (NFR9).
 * Files are encrypted at rest and never exposed under a public URL: they are read back
 * only through authorised endpoints (e.g. GET /fundus-images/:id/file).
 * Swap this class for an S3/@nestjs/storage implementation in production.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly root: string;

  constructor(
    config: ConfigService,
    private readonly security: SecurityService,
  ) {
    const directory = config.get<string>('storage.directory', 'storage');
    this.root = isAbsolute(directory)
      ? directory
      : resolve(process.cwd(), directory);
    SignedUrl.configure(
      createHash('sha256')
        .update(`signed-url:${config.getOrThrow<string>('encryption.key')}`)
        .digest(),
    );
  }

  static sha256(data: Buffer): string {
    return createHash('sha256').update(data).digest('hex');
  }

  private pathFor(key: string): string {
    const path = resolve(this.root, key);
    if (!path.startsWith(this.root + sep)) {
      throw new NotFoundException('File not found');
    }
    return path;
  }

  async save(folder: string, data: Buffer, extension: string): Promise<string> {
    const now = new Date();
    const key = join(
      folder,
      String(now.getUTCFullYear()),
      String(now.getUTCMonth() + 1).padStart(2, '0'),
      `${randomUUID()}.${extension}.enc`,
    );
    const path = this.pathFor(key);
    await mkdir(resolve(path, '..'), { recursive: true });
    await writeFile(path, this.security.encryptBuffer(data), { mode: 0o600 });
    return key;
  }

  async read(key: string): Promise<Buffer> {
    try {
      return this.security.decryptBuffer(await readFile(this.pathFor(key)));
    } catch (error) {
      this.logger.warn(`Could not read stored file: ${(error as Error).message}`);
      throw new NotFoundException('File not found');
    }
  }

  async remove(key: string | null | undefined): Promise<void> {
    if (!key) return;
    await rm(this.pathFor(key), { force: true });
  }
}

export const extensionForMime = (mime: string): string =>
  mime === 'image/png' ? 'png' : 'jpg';
