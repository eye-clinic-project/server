import { BadRequestException, Injectable } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js';
import { createWriteStream } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

const avatarExtensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const avatarStorage = {
  _handleFile(
    _request: Express.Request,
    file: Express.Multer.File,
    callback: (
      error?: Error | null,
      info?: Partial<Express.Multer.File>,
    ) => void,
  ) {
    const extension = avatarExtensions[file.mimetype];
    if (!extension) {
      callback(new BadRequestException('Only JPEG, PNG, or WebP images are allowed'));
      return;
    }

    const destination = join(process.cwd(), 'uploads', 'avatars');
    const filename = `${randomUUID()}${extension}`;
    const path = join(destination, filename);
    void mkdir(destination, { recursive: true }).then(
      () => {
        let size = 0;
        const output = createWriteStream(path, { flags: 'wx' });
        file.stream.on('data', (chunk: Buffer) => {
          size += chunk.length;
        });
        file.stream.once('error', (error: Error) => callback(error));
        output.once('error', (error: Error) => callback(error));
        output.once('finish', () =>
          callback(null, { destination, filename, path, size }),
        );
        file.stream.pipe(output);
      },
      (error: Error) => callback(error),
    );
  },
  _removeFile(
    _request: Express.Request,
    file: Express.Multer.File,
    callback: (error: Error | null) => void,
  ) {
    void unlink(file.path).then(
      () => callback(null),
      (error: Error) => callback(error),
    );
  },
};

export const avatarMulterOptions: MulterOptions = {
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (
    _request: Express.Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const extension = extname(file.originalname).toLowerCase();
    const expectedExtension = avatarExtensions[file.mimetype];
    const acceptedExtensions =
      file.mimetype === 'image/jpeg' ? ['.jpg', '.jpeg'] : [expectedExtension];
    if (
      !expectedExtension ||
      !acceptedExtensions.includes(extension)
    ) {
      callback(new BadRequestException('Only JPEG, PNG, or WebP images are allowed'), false);
      return;
    }
    callback(null, true);
  },
};

@Injectable()
export class UploadService {}
