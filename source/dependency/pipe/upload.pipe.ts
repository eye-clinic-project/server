import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/** Accepted image formats (NFR18): JPEG and PNG only. */
export const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png']);

export interface UploadImageOptions {
  maxSize?: number;
  required?: boolean;
}

/** Detects the real image type from the file's magic bytes. */
export const sniffImageType = (
  buffer: Buffer | undefined,
): 'image/jpeg' | 'image/png' | null => {
  if (!buffer || buffer.length < 8) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) {
    return 'image/png';
  }
  return null;
};

/**
 * Validates an uploaded image (FR3.1, NFR6, NFR18): JPEG/PNG only, within the size
 * limit, and the content must really be a JPEG/PNG (corrupted or disguised files are
 * rejected with a clear message instead of reaching the AI service).
 */
@Injectable()
export class UploadImagePipe implements PipeTransform<
  Express.Multer.File | undefined,
  Express.Multer.File | undefined
> {
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
        'Unsupported file format. Only JPEG and PNG images are allowed',
      );
    }

    const maxSize = this.options.maxSize ?? 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `Image is too large. The maximum size is ${Math.floor(maxSize / 1024 / 1024)} MB`,
      );
    }

    const realType = sniffImageType(file.buffer);
    if (!realType) {
      throw new BadRequestException(
        'The image file is corrupted or is not a valid JPEG/PNG image',
      );
    }
    file.mimetype = realType;
    return file;
  }
}
