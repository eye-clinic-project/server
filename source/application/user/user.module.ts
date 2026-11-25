import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule } from '../../dependencies/module/database.module.js';
import { ServiceModule } from '../../dependencies/module/service.module.js';
import { GetUserByIdHandler } from './custom/handler/get-user-by-id.handler.js';
import { RemoveUserAvatarHandler } from './custom/handler/remove-user-avatar.handler.js';
import { SetUserAvatarHandler } from './custom/handler/set-user-avatar.handler.js';
import { UpdateUserProfileHandler } from './custom/handler/update-user-profile.handler.js';
import { UserListener } from './event/user.listener.js';
import { USER_QUEUE, UserProcessor } from './queue/user.queue.js';
import { PhotosController } from './photos.controller.js';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';

@Module({
  imports: [DatabaseModule, ServiceModule, BullModule.registerQueue({ name: USER_QUEUE })],
  controllers: [UserController, PhotosController],
  providers: [UserService, UserListener, UserProcessor, GetUserByIdHandler, UpdateUserProfileHandler, SetUserAvatarHandler, RemoveUserAvatarHandler],
})
export class UserModule {}
