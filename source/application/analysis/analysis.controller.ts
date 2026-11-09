import { Body, Controller, Delete, Get, Param, Post, Query, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Auth } from '../../dependency/decorator/auth.decorator.js';
import { User } from '../../dependency/decorator/user.decorator.js';
import { RequestTimeout } from '../../dependency/decorator/timeout.decorator.js';
import type { HUserDocument } from '../../database/model/user.model.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { ParseObjectIdPipe } from '../../dependency/pipe/object-id.pipe.js';
import { AnalysisService } from './analysis.service.js';
import { AnalysisQueryDto, CreateAnalysisDto } from './dto/analysis.dto.js';

@ApiTags('Analyses (AI)')
@Controller('api/v1/analyses')
@Auth()
export class AnalysisController {
  constructor(private readonly service: AnalysisService) {}

  @Post()
  @Auth([SystemRoleEnum.DOCTOR])
  create(@User() user: HUserDocument, @Body() dto: CreateAnalysisDto) {
    return this.service.create(user, new Types.ObjectId(dto.imageId));
  }

  @Post(':analysisId/predict')
  @Auth([SystemRoleEnum.DOCTOR])
  @RequestTimeout(60_000)
  predict(@User() user: HUserDocument, @Param('analysisId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.run(user, id);
  }

  @Post(':analysisId/retry')
  @Auth([SystemRoleEnum.DOCTOR])
  @RequestTimeout(60_000)
  retry(@User() user: HUserDocument, @Param('analysisId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.retry(user, id);
  }

  @Get()
  list(@User() user: HUserDocument, @Query() query: AnalysisQueryDto) {
    return this.service.list(user, query);
  }

  @Get(':analysisId')
  findOne(@User() user: HUserDocument, @Param('analysisId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.findOne(user, id);
  }

  @Get(':analysisId/result')
  result(@User() user: HUserDocument, @Param('analysisId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.result(user, id);
  }

  @Get(':analysisId/grad-cam')
  async gradCam(@User() user: HUserDocument, @Param('analysisId', ParseObjectIdPipe) id: Types.ObjectId) {
    const file = await this.service.gradCam(user, id);
    return new StreamableFile(file.data, { type: file.mimeType, disposition: 'inline' });
  }

  @Get(':analysisId/history')
  history(@User() user: HUserDocument, @Param('analysisId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.history(user, id);
  }

  @Delete(':analysisId')
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  remove(@User() user: HUserDocument, @Param('analysisId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.remove(user, id);
  }
}
