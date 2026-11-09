import { Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Auth } from '../../dependency/decorator/auth.decorator.js';
import { User } from '../../dependency/decorator/user.decorator.js';
import type { HUserDocument } from '../../database/model/user.model.js';
import { ParseObjectIdPipe } from '../../dependency/pipe/object-id.pipe.js';
import { NotificationService } from './notification.service.js';
import { NotificationQueryDto } from './dto/notification.dto.js';

@ApiTags('Notifications')
@Controller('api/v1/notifications')
@Auth()
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  list(@User() user: HUserDocument, @Query() query: NotificationQueryDto) {
    return this.service.list(user, query);
  }

  // Declared before ':notificationId' routes so "read-all" is not parsed as an id.
  @Patch('read-all')
  readAll(@User() user: HUserDocument) {
    return this.service.markAllRead(user);
  }

  @Get(':notificationId')
  findOne(@User() user: HUserDocument, @Param('notificationId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.findOne(user, id);
  }

  @Patch(':notificationId/read')
  read(@User() user: HUserDocument, @Param('notificationId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.markRead(user, id);
  }

  @Delete()
  removeAll(@User() user: HUserDocument) {
    return this.service.removeAll(user);
  }

  @Delete(':notificationId')
  remove(@User() user: HUserDocument, @Param('notificationId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.remove(user, id);
  }
}
