import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { serveFile, uploadToDisk, type StoredUpload } from '@nestjs/storage';
import type { Request, Response } from 'express';
import type { Types } from 'mongoose';
import { randomUUID } from 'node:crypto';

import type { IUser } from '../../dependencies/interface/database.interface.js';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import type { AiHealth } from './ai.service.js';
import { AnalysisService } from './analysis.service.js';
import { CreateAnalysisDto } from './dto/create-analysis.dto.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { ListAnalysesDto } from './dto/list-analyses.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import type { AnalysisEntity } from './entity/analysis.entity.js';
import type { Page } from './entity/analysis.type.js';
import type { ReviewEntity } from './entity/review.entity.js';
import { Auth } from '../../dependencies/decorator/auth.decorator.js';
import { User } from '../../dependencies/decorator/user.decorator.js';
import { SystemRoleEnum } from '../../dependencies/enum/security.enum.js';

const { DOCTOR } = SystemRoleEnum;

const FUNDUS_MAX_BYTES = 10 * 1024 * 1024;
const FUNDUS_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Controller('analysis')
@Auth({ roles: [DOCTOR] })
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get('health')
  health(): Promise<AiHealth> {
    return this.analysisService.health();
  }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: uploadToDisk({ disk: 'private', contentTypes: FUNDUS_TYPES, key: (file) => `fundus/${randomUUID()}${file.extension}` }),
      limits: { fileSize: FUNDUS_MAX_BYTES, files: 1 },
    }),
  )
  create(@User() user: IUser, @UploadedFile() file: StoredUpload | undefined, @Body() body: CreateAnalysisDto): Promise<AnalysisEntity> {
    if (!file) throw new BadRequestException('Image file is required');
    return this.analysisService.create(user, file, body);
  }

  @Get()
  list(@User() user: IUser, @Query() query: ListAnalysesDto): Promise<Page<AnalysisEntity>> {
    return this.analysisService.list(user, query);
  }

  @Get(':id')
  get(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<AnalysisEntity> {
    return this.analysisService.get(user, id);
  }

  @Post(':id/retry')
  @HttpCode(HttpStatus.ACCEPTED)
  retry(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<AnalysisEntity> {
    return this.analysisService.retry(user, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<void> {
    return this.analysisService.remove(user, id);
  }

  @Get(':id/image')
  async image(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const key = await this.analysisService.imageKey(user, id);
    return serveFile(this.analysisService.storage, key, { req, res, disposition: 'inline', cacheControl: 'private, max-age=3600' });
  }

  @Get(':id/grad-cam')
  async gradCam(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const key = await this.analysisService.gradCamKey(user, id);
    return serveFile(this.analysisService.storage, key, { req, res, disposition: 'inline', cacheControl: 'private, max-age=3600' });
  }

  @Get(':id/review')
  getReview(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<ReviewEntity> {
    return this.analysisService.getReview(user, id);
  }

  @Post(':id/review')
  @HttpCode(HttpStatus.CREATED)
  createReview(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Body() body: CreateReviewDto): Promise<ReviewEntity> {
    return this.analysisService.createReview(user, id, body);
  }

  @Patch(':id/review')
  updateReview(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Body() body: UpdateReviewDto): Promise<ReviewEntity> {
    return this.analysisService.updateReview(user, id, body);
  }
}
