import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiHeader, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { SkipThrottle } from '@nestjs/throttler';
import { Types } from 'mongoose';
import { Auth } from '../../dependency/decorator/auth.decorator.js';
import { User } from '../../dependency/decorator/user.decorator.js';
import { RequestTimeout } from '../../dependency/decorator/timeout.decorator.js';
import type { HUserDocument } from '../../database/model/user.model.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { ParseObjectIdPipe } from '../../dependency/pipe/object-id.pipe.js';
import { UploadImagePipe } from '../../dependency/pipe/upload.pipe.js';
import { MAX_FUNDUS_IMAGE_BYTES } from '../fundus-image/fundus-image.controller.js';
import { HardwareService } from './hardware.service.js';
import { DEVICE_KEY_HEADER, DeviceGuard, type IDeviceReq } from './device.guard.js';
import {
  CaptureSessionQueryDto,
  CreateCaptureSessionDto,
  CreateDeviceDto,
  DeviceFailureDto,
  DeviceUploadDto,
  UpdateCaptureSessionDto,
  UpdateDeviceDto,
} from './dto/hardware.dto.js';

@ApiTags('Hardware (doctor)')
@Controller('api/v1/hardware')
@Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
export class HardwareController {
  constructor(private readonly service: HardwareService) {}

  @Post('devices')
  @Auth([SystemRoleEnum.DOCTOR])
  createDevice(@User() user: HUserDocument, @Body() dto: CreateDeviceDto) {
    return this.service.createDevice(user, dto);
  }

  @Get('devices')
  listDevices(@User() user: HUserDocument) {
    return this.service.listDevices(user);
  }

  @Get('devices/:deviceId')
  getDevice(@User() user: HUserDocument, @Param('deviceId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.getDevice(user, id);
  }

  @Patch('devices/:deviceId')
  updateDevice(@User() user: HUserDocument, @Param('deviceId', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: UpdateDeviceDto) {
    return this.service.updateDevice(user, id, dto);
  }

  @Post('devices/:deviceId/rotate-key')
  rotateKey(@User() user: HUserDocument, @Param('deviceId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.rotateKey(user, id);
  }

  @Delete('devices/:deviceId')
  removeDevice(@User() user: HUserDocument, @Param('deviceId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.removeDevice(user, id);
  }

  @Post('capture-sessions')
  @Auth([SystemRoleEnum.DOCTOR])
  createSession(@User() user: HUserDocument, @Body() dto: CreateCaptureSessionDto) {
    return this.service.createSession(user, dto);
  }

  @Get('capture-sessions')
  listSessions(@User() user: HUserDocument, @Query() query: CaptureSessionQueryDto) {
    return this.service.listSessions(user, query);
  }

  @Get('capture-sessions/:sessionId')
  getSession(@User() user: HUserDocument, @Param('sessionId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.getSession(user, id);
  }

  @Patch('capture-sessions/:sessionId')
  updateSession(@User() user: HUserDocument, @Param('sessionId', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: UpdateCaptureSessionDto) {
    return this.service.updateSession(user, id, dto);
  }
}

/** Endpoints called by the fundus camera itself, authenticated with its device key. */
@ApiTags('Hardware (device)')
@ApiHeader({ name: DEVICE_KEY_HEADER, required: true })
@Controller('api/v1/hardware/device')
@UseGuards(DeviceGuard)
@SkipThrottle()
export class DeviceController {
  constructor(private readonly service: HardwareService) {}

  @Post('heartbeat')
  heartbeat(@Req() req: IDeviceReq) {
    return this.service.heartbeat(req.device);
  }

  @Get('capture-sessions')
  pending(@Req() req: IDeviceReq) {
    return this.service.pendingSessions(req.device);
  }

  @Post('capture-sessions/:sessionId/image')
  @ApiConsumes('multipart/form-data')
  @RequestTimeout(60_000)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FUNDUS_IMAGE_BYTES + 1 } }))
  upload(
    @Req() req: IDeviceReq,
    @Param('sessionId', ParseObjectIdPipe) id: Types.ObjectId,
    @UploadedFile(new UploadImagePipe({ maxSize: MAX_FUNDUS_IMAGE_BYTES })) file: Express.Multer.File,
    @Body() dto: DeviceUploadDto,
  ) {
    return this.service.deviceUpload(req.device, id, file, dto);
  }

  @Post('capture-sessions/:sessionId/fail')
  fail(@Req() req: IDeviceReq, @Param('sessionId', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: DeviceFailureDto) {
    return this.service.markFailed(req.device, id, dto.error);
  }
}
