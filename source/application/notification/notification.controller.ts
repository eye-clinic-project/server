import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import type { Types } from 'mongoose';

import type { IUser } from '../../dependencies/interface/index.js';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { ListNotificationsDto } from './dto/index.js';
import { NotificationEntity, type NotificationPage } from './entity/index.js';
import { NotificationInboxService } from './notification.service.js';
import { Auth, User } from '../../dependencies/decorator/index.js';

@Controller('notification')
@Auth()
export class NotificationController {
  constructor(private readonly notificationInboxService: NotificationInboxService) {}

  @Get()
  list(@User() user: IUser, @Query() query: ListNotificationsDto): Promise<NotificationPage> {
    return this.notificationInboxService.list(user, query);
  }

  @Get('unread-count')
  unreadCount(@User() user: IUser): Promise<{ unreadCount: number }> {
    return this.notificationInboxService.unreadCount(user);
  }

  @Patch('read-all')
  markAllRead(@User() user: IUser): Promise<{ updated: number }> {
    return this.notificationInboxService.markAllRead(user);
  }

  @Patch(':id/read')
  markRead(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<NotificationEntity> {
    return this.notificationInboxService.markRead(user, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<void> {
    return this.notificationInboxService.remove(user, id);
  }
}
