import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Types } from 'mongoose';
import { Auth } from '../../dependency/decorator/auth.decorator.js';
import { User } from '../../dependency/decorator/user.decorator.js';
import { RequestTimeout } from '../../dependency/decorator/timeout.decorator.js';
import type { HUserDocument } from '../../database/model/user.model.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { ParseObjectIdPipe } from '../../dependency/pipe/object-id.pipe.js';
import { UploadImagePipe } from '../../dependency/pipe/upload.pipe.js';
import { FundusImageService } from './fundus-image.service.js';
import { FundusImageQueryDto, UpdateFundusImageDto, UploadFundusImageDto } from './dto/fundus-image.dto.js';
import { RateLimit } from '../../dependency/decorator/rate-limit.decorator.js';

export const MAX_FUNDUS_IMAGE_BYTES =
  (parseInt(process.env.MAX_IMAGE_SIZE_MB ?? '', 10) || 10) * 1024 * 1024;

@ApiTags('Fundus images')
@Controller('api/v1/fundus-images')
@Auth()
export class FundusImageController {
  constructor(private readonly service: FundusImageService) {}

  /** FR3.1: upload a JPEG/PNG fundus image for an assigned patient (and analyse it). */
  @RateLimit.upload()
  @Post()
  @Auth([SystemRoleEnum.DOCTOR])
  @ApiConsumes('multipart/form-data')
  @RequestTimeout(60_000)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FUNDUS_IMAGE_BYTES + 1 } }))
  @ApiOperation({
    summary: "Upload a fundus image",
    description: "Assigned doctor only (FR3.1). multipart/form-data: file (JPEG or PNG, up to MAX_IMAGE_SIZE_MB, default 10 MB), patientId, optional eye, notes, capturedAt and analyze (default true). Unsupported formats, oversized and corrupted files return 400 with a clear message (NFR6, NFR18). The original bytes are stored encrypted and unmodified (FR3.2). With analyze = true the AI analysis runs right away and is returned in `analysis`.",
  })
  upload(
    @User() user: HUserDocument,
    @UploadedFile(new UploadImagePipe({ maxSize: MAX_FUNDUS_IMAGE_BYTES })) file: Express.Multer.File,
    @Body() dto: UploadFundusImageDto,
  ) {
    return this.service.upload(user, file, dto);
  }

  @Get()
  @ApiOperation({
    summary: "List fundus images",
    description: "Patient: their own. Doctor: their assigned patients. Admin: all. Filter by patientId and eye. Each image includes a short-lived signed fileUrl for <img> tags.",
  })
  list(@User() user: HUserDocument, @Query() query: FundusImageQueryDto) {
    return this.service.list(user, query);
  }

  @Get(':imageId')
  @ApiOperation({
    summary: "Get a fundus image",
    description: "The patient, an assigned doctor or an admin. Image metadata plus the analyses run on it.",
  })
  findOne(@User() user: HUserDocument, @Param('imageId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.findOne(user, id);
  }

  @Get(':imageId/file')
  @ApiOperation({
    summary: "Download the original image",
    description: "The patient, an assigned doctor or an admin. Returns the original bytes. Add ?download=1 to download as an attachment.",
  })
  async file(
    @User() user: HUserDocument,
    @Param('imageId', ParseObjectIdPipe) id: Types.ObjectId,
    @Query('download') download?: string,
  ) {
    const file = await this.service.file(user, id);
    return new StreamableFile(file.data, {
      type: file.mimeType,
      disposition: `${download ? 'attachment' : 'inline'}; filename="${file.filename}"`,
    });
  }

  @Patch(':imageId')
  @Auth([SystemRoleEnum.DOCTOR])
  @ApiOperation({
    summary: "Edit image details",
    description: "Assigned doctor only. Changes eye, notes or capture date. The image itself cannot be replaced.",
  })
  update(
    @User() user: HUserDocument,
    @Param('imageId', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: UpdateFundusImageDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete(':imageId')
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  @ApiOperation({
    summary: "Delete a fundus image",
    description: "Assigned doctor or admin. Delete the image's analyses first (409 otherwise). The stored file is removed.",
  })
  remove(@User() user: HUserDocument, @Param('imageId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.remove(user, id);
  }
}
