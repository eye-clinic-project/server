import {
  applyDecorators,
  Injectable,
  mixin,
  NotFoundException,
  StreamableFile,
  UseInterceptors,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
  type Type,
} from '@nestjs/common';
import { serveFile, Storage, StorageFileNotFoundError } from '@nestjs/storage';
import { from, type Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

export interface ServeImageOptions {
  cacheControl?: string;
}

const IMMUTABLE = 'public, max-age=31536000, immutable';

export function ImageInterceptor(disk: string, options: ServeImageOptions = {}): Type<NestInterceptor> {
  @Injectable()
  class MixinImageInterceptor implements NestInterceptor {
    constructor(private readonly storage: Storage) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<StreamableFile | undefined> {
      const http = context.switchToHttp();
      return next.handle().pipe(mergeMap((key: unknown) => from(this.serve(key, http.getRequest(), http.getResponse()))));
    }

    private async serve(key: unknown, req: unknown, res: unknown): Promise<StreamableFile | undefined> {
      if (key instanceof StreamableFile) return key;
      if (typeof key !== 'string' || key.length === 0) throw new NotFoundException();

      const store = this.storage.disk(disk);
      const file = await store.stat(key).catch((error: unknown) => {
        if (error instanceof StorageFileNotFoundError) throw new NotFoundException();
        throw error;
      });

      if (!file.contentType.startsWith('image/') || file.contentType.startsWith('image/svg')) throw new NotFoundException();
      return serveFile(store, key, { req, res, disposition: 'inline', cacheControl: options.cacheControl ?? IMMUTABLE });
    }
  }
  return mixin(MixinImageInterceptor);
}

export const ServeImage = (disk: string, options?: ServeImageOptions) => applyDecorators(UseInterceptors(ImageInterceptor(disk, options)));
