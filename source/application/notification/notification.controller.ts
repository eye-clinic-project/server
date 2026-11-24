import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import type { Types } from 'mongoose';

import type { IUser } from '../../dependencies/interface/database.interface.js';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { ListNotificationsDto } from './dto/list-notifications.dto.js';
import { NotificationEntity } from './entity/notification.entity.js';
import type { NotificationPage } from './entity/notification.type.js';
import { NotificationInboxService } from './notification.service.js';
import { Auth } from '../../dependencies/decorator/auth.decorator.js';
import { User } from '../../dependencies/decorator/user.decorator.js';

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
