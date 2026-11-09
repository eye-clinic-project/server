import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Types } from 'mongoose';
import { Auth } from '../../dependency/decorator/auth.decorator.js';
import { User } from '../../dependency/decorator/user.decorator.js';
import type { HUserDocument } from '../../database/model/user.model.js';
import { ParseObjectIdPipe } from '../../dependency/pipe/object-id.pipe.js';
import { UploadImagePipe } from '../../dependency/pipe/upload.pipe.js';
import { UserService } from './user.service.js';
import { DeleteAccountDto, UpdateUserDto } from './dto/update-user.dto.js';

@ApiTags('Users')
@Controller('api/v1/users')
@Auth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({
    summary: "Get my account",
    description: "Any signed-in user. Same data as GET /auth/me: account fields plus the role profile.",
  })
  me(@User() user: HUserDocument) {
    return this.userService.getMe(user);
  }

  @Patch('me')
  @ApiOperation({
    summary: "Update my account",
    description: "Any signed-in user. Edits name, city, phone and language (FR1.5). Changes are saved and returned after re-login.",
  })
  update(@User() user: HUserDocument, @Body() dto: UpdateUserDto) {
    return this.userService.updateMe(user, dto);
  }

  @Delete('me')
  @ApiOperation({
    summary: "Delete my account",
    description: "Any signed-in user. Email/password accounts must send their password. For patients this also deletes their images, analyses, reviews, reports and stored files. Doctors' assignments are ended.",
  })
  remove(@User() user: HUserDocument, @Body() dto: DeleteAccountDto) {
    return this.userService.deleteMe(user, dto);
  }

  @Patch('me/avatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 3 * 1024 * 1024 } }))
  @ApiOperation({
    summary: "Upload my profile picture",
    description: "Any signed-in user. multipart/form-data with field `file` (JPEG or PNG, up to 3 MB). The image is stored encrypted and returned as a signed avatarUrl.",
  })
  avatar(
    @User() user: HUserDocument,
    @UploadedFile(new UploadImagePipe({ maxSize: 3 * 1024 * 1024 })) file: Express.Multer.File,
  ) {
    return this.userService.updateAvatar(user, file);
  }

  @Delete('me/avatar')
  @ApiOperation({
    summary: "Remove my profile picture",
    description: "Any signed-in user. Deletes the stored avatar file.",
  })
  removeAvatar(@User() user: HUserDocument) {
    return this.userService.removeAvatar(user);
  }

  @Get(':userId/avatar')
  @ApiOperation({
    summary: "Download a user's profile picture",
    description: "Any signed-in user. Returns the image bytes. Clients usually use the signed avatarUrl instead.",
  })
  async avatarFile(@Param('userId', ParseObjectIdPipe) userId: Types.ObjectId) {
    const file = await this.userService.avatarFile(userId);
    return new StreamableFile(file.data, { type: file.mimeType, disposition: 'inline' });
  }

  @Get(':userId')
  @ApiOperation({
    summary: "Get a user's profile",
    description: "Any signed-in user. Doctor profiles are visible to everyone signed in. Patient profiles only to the patient, their assigned doctors and admins (otherwise 403).",
  })
  findOne(
    @User() user: HUserDocument,
    @Param('userId', ParseObjectIdPipe) userId: Types.ObjectId,
  ) {
    return this.userService.getUser(user, userId);
  }
}
