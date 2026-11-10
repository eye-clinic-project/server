import { Body, Controller, Delete, Get, Param, Post, Query, StreamableFile } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Auth } from '../../dependency/decorator/auth.decorator.js';
import { User } from '../../dependency/decorator/user.decorator.js';
import { RequestTimeout } from '../../dependency/decorator/timeout.decorator.js';
import type { HUserDocument } from '../../database/model/user.model.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { ParseObjectIdPipe } from '../../dependency/pipe/object-id.pipe.js';
import { AnalysisService } from './analysis.service.js';
import { AnalysisQueryDto, CreateAnalysisDto } from './dto/analysis.dto.js';
import { RateLimit } from '../../dependency/decorator/rate-limit.decorator.js';

@ApiTags('Analyses (AI)')
@Controller('api/v1/analyses')
@Auth()
export class AnalysisController {
  constructor(private readonly service: AnalysisService) {}

  @RateLimit.create()
  @Post()
  @Auth([SystemRoleEnum.DOCTOR])
  @ApiOperation({
    summary: 'Create an analysis',
    description: 'Assigned doctor only. Creates a pending analysis for an uploaded image. Call POST /analyses/{id}/predict to run it.',
  })
  create(@User() user: HUserDocument, @Body() dto: CreateAnalysisDto) {
    return this.service.create(user, new Types.ObjectId(dto.imageId));
  }

  @RateLimit.aiInference()
  @Post(':analysisId/predict')
  @Auth([SystemRoleEnum.DOCTOR])
  @RequestTimeout(60_000)
  @ApiOperation({
    summary: 'Run the AI prediction',
    description:
      "Assigned doctor only (FR3.2 – FR3.7). Sends the original image to the AI service: preprocessing, Stage-1 DR detection, Stage-2 grading (0 No DR, 1 Mild, 2 Moderate, 3 Severe, 4 Proliferative), TTA and Grad-CAM. The result is saved to the patient's history and the patient is notified in the app and by email. If the AI service fails, the analysis is returned with status failed and an error message and can be retried. Already completed analyses return 409.",
  })
  predict(@User() user: HUserDocument, @Param('analysisId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.run(user, id);
  }

  @RateLimit.aiInference()
  @Post(':analysisId/retry')
  @Auth([SystemRoleEnum.DOCTOR])
  @RequestTimeout(60_000)
  @ApiOperation({
    summary: 'Retry a failed analysis',
    description: 'Assigned doctor only. Runs the prediction again for an analysis with status failed (for example, when the AI service was not available).',
  })
  retry(@User() user: HUserDocument, @Param('analysisId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.retry(user, id);
  }

  @Get()
  @ApiOperation({
    summary: 'List analyses',
    description: 'Patient: their own (FR4.1). Doctor: their assigned patients. Admin: all. Filter by patientId, imageId and status. Newest first (FR4.2).',
  })
  list(@User() user: HUserDocument, @Query() query: AnalysisQueryDto) {
    return this.service.list(user, query);
  }

  @Get(':analysisId')
  @ApiOperation({
    summary: 'Get an analysis',
    description:
      'The patient, an assigned doctor or an admin. Status, result (DR status, grade in plain language, confidence, class probabilities, signed Grad-CAM URL), the image, doctor reviews and the decision-support disclaimer (NFR14, NFR19).',
  })
  findOne(@User() user: HUserDocument, @Param('analysisId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.findOne(user, id);
  }

  @Get(':analysisId/result')
  @ApiOperation({
    summary: 'Get only the prediction result',
    description: 'The patient, an assigned doctor or an admin. ready = false while the analysis is pending, processing or failed.',
  })
  result(@User() user: HUserDocument, @Param('analysisId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.result(user, id);
  }

  @RateLimit.aiInference()
  @Get(':analysisId/grad-cam')
  @ApiOperation({
    summary: 'Download the Grad-CAM heatmap',
    description: 'The patient, an assigned doctor or an admin (FR3.5). Returns the overlay image. 404 when the AI service did not return a heatmap.',
  })
  async gradCam(@User() user: HUserDocument, @Param('analysisId', ParseObjectIdPipe) id: Types.ObjectId) {
    const file = await this.service.gradCam(user, id);
    return new StreamableFile(file.data, { type: file.mimeType, disposition: 'inline' });
  }

  @Get(':analysisId/history')
  @ApiOperation({
    summary: 'Get the analysis history',
    description: 'The patient, an assigned doctor or an admin. Every status change (pending, processing, completed, failed) with time and message.',
  })
  history(@User() user: HUserDocument, @Param('analysisId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.history(user, id);
  }

  @Delete(':analysisId')
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  @ApiOperation({
    summary: 'Delete an analysis',
    description: 'Assigned doctor or admin. Delete reports generated from it first (409 otherwise). Its reviews and heatmap are removed too.',
  })
  remove(@User() user: HUserDocument, @Param('analysisId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.remove(user, id);
  }
}
