import { AllowPendingDoctor } from '../../dependency/decorator/doctor-approval.decorator.js';
import { Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
@AllowPendingDoctor()
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  @ApiOperation({
    summary: 'List my notifications',
    description:
      'Any signed-in user. Newest first, paginated, with unreadCount. Filter by unread=true and type (analysis, report, appointment, message, follow_up, system). New notifications are also pushed over Socket.IO as `notification`.',
  })
  list(@User() user: HUserDocument, @Query() query: NotificationQueryDto) {
    return this.service.list(user, query);
  }

  // Declared before ':notificationId' routes so "read-all" is not parsed as an id.
  @Patch('read-all')
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Any signed-in user.',
  })
  readAll(@User() user: HUserDocument) {
    return this.service.markAllRead(user);
  }

  @Get(':notificationId')
  @ApiOperation({
    summary: 'Get a notification',
    description: 'The recipient only.',
  })
  findOne(@User() user: HUserDocument, @Param('notificationId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.findOne(user, id);
  }

  @Patch(':notificationId/read')
  @ApiOperation({
    summary: 'Mark a notification as read',
    description: 'The recipient only.',
  })
  read(@User() user: HUserDocument, @Param('notificationId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.markRead(user, id);
  }

  @Delete()
  @ApiOperation({
    summary: 'Delete all my notifications',
    description: 'Any signed-in user.',
  })
  removeAll(@User() user: HUserDocument) {
    return this.service.removeAll(user);
  }

  @Delete(':notificationId')
  @ApiOperation({
    summary: 'Delete a notification',
    description: 'The recipient only.',
  })
  remove(@User() user: HUserDocument, @Param('notificationId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.remove(user, id);
  }
}
