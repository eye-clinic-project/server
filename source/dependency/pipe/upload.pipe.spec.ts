import { BadRequestException } from '@nestjs/common';
import { UploadImagePipe, sniffImageType } from './upload.pipe.js';

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0]);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const file = (mimetype: string, buffer: Buffer, size = buffer.length) => ({ mimetype, buffer, size }) as Express.Multer.File;

describe('UploadImagePipe (FR3.1, NFR6, NFR18)', () => {
  const pipe = new UploadImagePipe({ maxSize: 100 });

  it('detects JPEG and PNG by content', () => {
    expect(sniffImageType(jpeg)).toBe('image/jpeg');
    expect(sniffImageType(png)).toBe('image/png');
    expect(sniffImageType(Buffer.from('hello world'))).toBeNull();
  });

  it('accepts JPEG/PNG within the limit and fixes a wrong declared type', () => {
    expect(pipe.transform(file('image/png', jpeg))?.mimetype).toBe('image/jpeg');
  });

  it('rejects other formats, oversized and corrupted files', () => {
    expect(() => pipe.transform(file('image/gif', jpeg))).toThrow(/Only JPEG and PNG/);
    expect(() => pipe.transform(file('image/jpeg', jpeg, 101))).toThrow(/too large/);
    expect(() => pipe.transform(file('image/jpeg', Buffer.from('not an image')))).toThrow(/corrupted/);
    expect(() => pipe.transform(undefined)).toThrow(BadRequestException);
  });
});
