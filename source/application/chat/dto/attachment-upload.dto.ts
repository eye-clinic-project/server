import { IsInstance, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

const toBuffer = ({ value }: { value: unknown }) => {
  if (typeof value === 'string') return Buffer.from(value, 'base64');
  if (value instanceof ArrayBuffer || value instanceof Uint8Array) return Buffer.from(value as Uint8Array);
  if (Array.isArray(value) && value.every((byte) => Number.isInteger(byte))) return Buffer.from(value as number[]);
  return value;
};

export class AttachmentUploadDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  name?: string;

  @Transform(toBuffer)
  @IsInstance(Buffer)
  data!: Buffer;
}
