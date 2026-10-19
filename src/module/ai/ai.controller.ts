import { Controller, Post, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, NotFoundException } from '@nestjs/common';
import { AiService } from './ai.service.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExtensionValidator } from '../../common/pipe/upload.pipe.js';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) { }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile(
    new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        new FileTypeValidator({ fileType: /^image\/(png|jpeg)$/ }),
        new ExtensionValidator({
          allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
        }),
      ],

    }),) file: Express.Multer.File) {
    return this.aiService.uploadToFastAPI(file);
  }
}
