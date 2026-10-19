import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AiService } from './ai.service.js';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.aiService.uploadToFastAPI(file);
  }
}
