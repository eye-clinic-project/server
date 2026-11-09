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
import { ApiConsumes, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { RateLimit } from '../../dependency/decorator/rate-limit.decorator.js';

@ApiTags('Hardware (doctor)')
@Controller('api/v1/hardware')
@Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
export class HardwareController {
  constructor(private readonly service: HardwareService) {}

  @RateLimit.create()
  @Post('devices')
  @Auth([SystemRoleEnum.DOCTOR])
  @ApiOperation({
    summary: "Register a fundus camera",
    description: "Doctor only (FR7.1). Returns the device with its API key in `apiKey`. The key is shown only once; store it on the device and send it as the x-device-key header.",
  })
  createDevice(@User() user: HUserDocument, @Body() dto: CreateDeviceDto) {
    return this.service.createDevice(user, dto);
  }

  @Get('devices')
  @ApiOperation({
    summary: "List devices",
    description: "Doctor: their devices. Admin: all. Includes status, last seen time and whether the device is online (seen in the last 2 minutes).",
  })
  listDevices(@User() user: HUserDocument) {
    return this.service.listDevices(user);
  }

  @Get('devices/:deviceId')
  @ApiOperation({
    summary: "Get a device",
    description: "The device's doctor or an admin.",
  })
  getDevice(@User() user: HUserDocument, @Param('deviceId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.getDevice(user, id);
  }

  @Patch('devices/:deviceId')
  @ApiOperation({
    summary: "Update a device",
    description: "The device's doctor or an admin. Changes name, model, location or status (active, inactive, maintenance). Only active devices can upload.",
  })
  updateDevice(@User() user: HUserDocument, @Param('deviceId', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: UpdateDeviceDto) {
    return this.service.updateDevice(user, id, dto);
  }

  @RateLimit.sensitive()
  @Post('devices/:deviceId/rotate-key')
  @ApiOperation({
    summary: "Generate a new device key",
    description: "The device's doctor or an admin. The old key stops working at once. The new key is shown only once.",
  })
  rotateKey(@User() user: HUserDocument, @Param('deviceId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.rotateKey(user, id);
  }

  @Delete('devices/:deviceId')
  @ApiOperation({
    summary: "Delete a device",
    description: "The device's doctor or an admin. Open capture sessions are cancelled.",
  })
  removeDevice(@User() user: HUserDocument, @Param('deviceId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.removeDevice(user, id);
  }

  @RateLimit.create()
  @Post('capture-sessions')
  @Auth([SystemRoleEnum.DOCTOR])
  @ApiOperation({
    summary: "Start a capture session",
    description: "Assigned doctor only (FR7.1). Asks a device to capture an image of a patient (optional eye). With autoAnalyze (default true), the uploaded image goes through the same detection flow as a manual upload. Sessions expire after 30 minutes.",
  })
  createSession(@User() user: HUserDocument, @Body() dto: CreateCaptureSessionDto) {
    return this.service.createSession(user, dto);
  }

  @Get('capture-sessions')
  @ApiOperation({
    summary: "List capture sessions",
    description: "Doctor: theirs. Admin: all. Filter by status and deviceId.",
  })
  listSessions(@User() user: HUserDocument, @Query() query: CaptureSessionQueryDto) {
    return this.service.listSessions(user, query);
  }

  @Get('capture-sessions/:sessionId')
  @ApiOperation({
    summary: "Get a capture session",
    description: "The session's doctor or an admin. Shows status, the resulting image and analysis, or the error if the capture failed.",
  })
  getSession(@User() user: HUserDocument, @Param('sessionId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.getSession(user, id);
  }

  @Patch('capture-sessions/:sessionId')
  @ApiOperation({
    summary: "Cancel or mark a session as capturing",
    description: "The session's doctor or an admin. Only pending or capturing sessions can change.",
  })
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
  @ApiOperation({
    summary: "Device heartbeat",
    description: "Device only (x-device-key header). Updates the device's last seen time and returns its status and the server time.",
  })
  heartbeat(@Req() req: IDeviceReq) {
    return this.service.heartbeat(req.device);
  }

  @Get('capture-sessions')
  @ApiOperation({
    summary: "Get pending capture sessions",
    description: "Device only (x-device-key header). Sessions the device should capture now, oldest first.",
  })
  pending(@Req() req: IDeviceReq) {
    return this.service.pendingSessions(req.device);
  }

  @Post('capture-sessions/:sessionId/image')
  @ApiConsumes('multipart/form-data')
  @RequestTimeout(60_000)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FUNDUS_IMAGE_BYTES + 1 } }))
  @ApiOperation({
    summary: "Upload a captured image",
    description: "Device only (x-device-key header) (FR7.1). multipart/form-data with `file` (JPEG or PNG). The image is added to the patient's record and, with autoAnalyze, analysed like a manual upload. On failure the session is marked failed and the doctor is notified.",
  })
  upload(
    @Req() req: IDeviceReq,
    @Param('sessionId', ParseObjectIdPipe) id: Types.ObjectId,
    @UploadedFile(new UploadImagePipe({ maxSize: MAX_FUNDUS_IMAGE_BYTES })) file: Express.Multer.File,
    @Body() dto: DeviceUploadDto,
  ) {
    return this.service.deviceUpload(req.device, id, file, dto);
  }

  @Post('capture-sessions/:sessionId/fail')
  @ApiOperation({
    summary: "Report a failed capture",
    description: "Device only (x-device-key header). Marks the session failed with the error message. The doctor sees the error in real time and gets a notification (FR7.1).",
  })
  fail(@Req() req: IDeviceReq, @Param('sessionId', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: DeviceFailureDto) {
    return this.service.markFailed(req.device, id, dto.error);
  }
}
