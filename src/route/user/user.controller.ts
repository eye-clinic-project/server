import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Auth } from '../../common/decorator/auth.decorator.js';
import { User } from '../../common/decorator/user.decorator.js';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import type { HUserDocument } from '../../core/database/model/user.model.js';
import { UserService } from './user.service.js';

@Controller('user')
@ApiTags('Users')
@Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('me/avatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['avatar'],
      properties: {
        avatar: { type: 'string', format: 'binary' },
      },
    },
  })

  @UseInterceptors(FileInterceptor('avatar'))
  uploadAvatar(
    @User() user: HUserDocument,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('An avatar image file is required');
    }
    return this.userService.updateMyAvatar(
      user._id,
      `/assets/avatars/${file.filename}`,
    );
  }
}
