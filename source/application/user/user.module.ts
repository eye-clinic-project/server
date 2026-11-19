import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule, ServiceModule } from '../../dependencies/module/index.js';
import { GetUserByIdHandler, RemoveUserAvatarHandler, SetUserAvatarHandler, UpdateUserProfileHandler } from './cqrs/handler/index.js';
import { UserListener } from './event/index.js';
import { USER_QUEUE, UserProcessor } from './queue/index.js';
import { PhotosController } from './photos.controller.js';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';

@Module({
  imports: [DatabaseModule, ServiceModule, BullModule.registerQueue({ name: USER_QUEUE })],
  controllers: [UserController, PhotosController],
  providers: [UserService, UserListener, UserProcessor, GetUserByIdHandler, UpdateUserProfileHandler, SetUserAvatarHandler, RemoveUserAvatarHandler],
})
export class UserModule {}
