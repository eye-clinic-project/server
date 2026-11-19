import { BadRequestException, Controller, Get, Param } from '@nestjs/common';

import { Auth } from '../../dependencies/decorator/index.js';
import { ServeImage } from '../../dependencies/interceptor/index.js';

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
