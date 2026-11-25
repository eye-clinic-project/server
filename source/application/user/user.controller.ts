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
  Put,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Can } from '@nestjs/authorization';
import { uploadToDisk, type StoredUpload } from '@nestjs/storage';
import { randomUUID } from 'node:crypto';

import type { IUser } from '../../dependencies/interface/database.interface.js';
import { ServeImage } from '../../dependencies/interceptor/image.interceptor.js';
import { DeviceTokenDto } from './dto/device-token.dto.js';
import { RegisterDeviceDto } from './dto/register-device.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserEntity } from './entity/user.entity.js';
import { UserService } from './user.service.js';
import { Auth } from '../../dependencies/decorator/auth.decorator.js';
import { User } from '../../dependencies/decorator/user.decorator.js';

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Controller('user')
@Auth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getMe(@User() user: IUser): Promise<UserEntity> {
    return this.userService.getMe(user);
  }

  @Patch('me')
  updateMe(@User() user: IUser, @Body() body: UpdateUserDto): Promise<UserEntity> {
    return this.userService.updateMe(user, body);
  }

  @Put('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: uploadToDisk({
        disk: 'photos',
        contentTypes: AVATAR_TYPES,
        key: (file, req: { user?: IUser | null }) => {
          if (!req.user?._id) throw new UnauthorizedException();
          return `avatars/${String(req.user._id)}/${randomUUID()}${file.extension}`;
        },
      }),
      limits: { fileSize: AVATAR_MAX_BYTES, files: 1 },
    }),
  )
  
  setAvatar(@User() user: IUser, @UploadedFile() file: StoredUpload | undefined): Promise<UserEntity> {
    if (!file) throw new BadRequestException('Avatar file is required');
    return this.userService.setAvatar(user, file);
  }

  @Put('me/devices')
  @HttpCode(HttpStatus.NO_CONTENT)
  registerDevice(@User() user: IUser, @Body() body: RegisterDeviceDto): Promise<void> {
    return this.userService.registerDevice(user, body);
  }

  @Delete('me/devices')
  @HttpCode(HttpStatus.NO_CONTENT)
  unregisterDevice(@User() user: IUser, @Body() body: DeviceTokenDto): Promise<void> {
    return this.userService.unregisterDevice(user, body);
  }

  @Delete('me/avatar')
  @HttpCode(HttpStatus.OK)
  removeAvatar(@User() user: IUser): Promise<UserEntity> {
    return this.userService.removeAvatar(user);
  }
}

@Controller('photos')
@Auth({ public: true })
export class PhotosController {
  @Get('avatars/:userId/:file')
  @ServeImage('photos')
  avatar(@Param('userId') userId: string, @Param('file') file: string): string {
    if (!/^[a-f0-9]{24}$/.test(userId) || !/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(file)) throw new BadRequestException('Invalid id');
    return `avatars/${userId}/${file}`;
  }
}
