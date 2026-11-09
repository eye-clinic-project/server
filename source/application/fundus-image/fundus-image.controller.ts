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
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
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

export const MAX_FUNDUS_IMAGE_BYTES =
  (parseInt(process.env.MAX_IMAGE_SIZE_MB ?? '', 10) || 10) * 1024 * 1024;

@ApiTags('Fundus images')
@Controller('api/v1/fundus-images')
@Auth()
export class FundusImageController {
  constructor(private readonly service: FundusImageService) {}

  /** FR3.1: upload a JPEG/PNG fundus image for an assigned patient (and analyse it). */
  @Post()
  @Auth([SystemRoleEnum.DOCTOR])
  @ApiConsumes('multipart/form-data')
  @RequestTimeout(60_000)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FUNDUS_IMAGE_BYTES + 1 } }))
  upload(
    @User() user: HUserDocument,
    @UploadedFile(new UploadImagePipe({ maxSize: MAX_FUNDUS_IMAGE_BYTES })) file: Express.Multer.File,
    @Body() dto: UploadFundusImageDto,
  ) {
    return this.service.upload(user, file, dto);
  }

  @Get()
  list(@User() user: HUserDocument, @Query() query: FundusImageQueryDto) {
    return this.service.list(user, query);
  }

  @Get(':imageId')
  findOne(@User() user: HUserDocument, @Param('imageId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.findOne(user, id);
  }

  @Get(':imageId/file')
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
  update(
    @User() user: HUserDocument,
    @Param('imageId', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: UpdateFundusImageDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete(':imageId')
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  remove(@User() user: HUserDocument, @Param('imageId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.remove(user, id);
  }
}
