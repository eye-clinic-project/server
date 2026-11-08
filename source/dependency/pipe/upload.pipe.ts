import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export interface UploadImageOptions {
  maxSize?: number;
  required?: boolean;
}

@Injectable()
export class UploadImagePipe implements PipeTransform<Express.Multer.File | undefined,Express.Multer.File | undefined> {
  constructor(private readonly options: UploadImageOptions = {}) {}

  transform(
    file: Express.Multer.File | undefined,
  ): Express.Multer.File | undefined {
    if (!file) {
      if (this.options.required !== false) {
        throw new BadRequestException('Image file is required');
      }

      return undefined;
    }

    if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, WEBP, and GIF images are allowed',
      );
    }

    const maxSize = this.options.maxSize ?? 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `Image size must not exceed ${Math.floor(maxSize / 1024 / 1024)} MB`,
      );
    }

    return file;
  }
}