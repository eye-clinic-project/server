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
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
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
  me(@User() user: HUserDocument) {
    return this.userService.getMe(user);
  }

  @Patch('me')
  update(@User() user: HUserDocument, @Body() dto: UpdateUserDto) {
    return this.userService.updateMe(user, dto);
  }

  @Delete('me')
  remove(@User() user: HUserDocument, @Body() dto: DeleteAccountDto) {
    return this.userService.deleteMe(user, dto);
  }

  @Patch('me/avatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 3 * 1024 * 1024 } }))
  avatar(
    @User() user: HUserDocument,
    @UploadedFile(new UploadImagePipe({ maxSize: 3 * 1024 * 1024 })) file: Express.Multer.File,
  ) {
    return this.userService.updateAvatar(user, file);
  }

  @Delete('me/avatar')
  removeAvatar(@User() user: HUserDocument) {
    return this.userService.removeAvatar(user);
  }

  @Get(':userId/avatar')
  async avatarFile(@Param('userId', ParseObjectIdPipe) userId: Types.ObjectId) {
    const file = await this.userService.avatarFile(userId);
    return new StreamableFile(file.data, { type: file.mimeType, disposition: 'inline' });
  }

  @Get(':userId')
  findOne(
    @User() user: HUserDocument,
    @Param('userId', ParseObjectIdPipe) userId: Types.ObjectId,
  ) {
    return this.userService.getUser(user, userId);
  }
}
