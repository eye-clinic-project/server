import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from '../../common/decorator/auth.decorator.js';
import { User } from '../../common/decorator/user.decorator.js';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import type { HUserDocument } from '../../core/database/model/user.model.js';
import { CreateNotificationDto } from './dto/create-notification.dto.js';
import { NotificationQueryDto } from './dto/notification-query.dto.js';
import { NotificationService } from './notification.service.js';

@Controller('notification')
@Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  send(@User() user: HUserDocument, @Body() dto: CreateNotificationDto) {
    return this.notificationService.sendToAssignedParticipant(
      user._id.toString(),
      dto,
    );
  }

  @Get('unread/count')
  countUnread(@User() user: HUserDocument) {
    return this.notificationService.countUnreadForUser(user._id.toString());
  }

  @Get('unread')
  findUnread(@User() user: HUserDocument) {
    return this.notificationService.findUnreadForUser(user._id.toString());
  }

  @Get()
  findAll(@User() user: HUserDocument, @Query() query: NotificationQueryDto) {
    return this.notificationService.findForUser(
      user._id.toString(),
      query.limit,
      query.skip,
    );
  }

  @Patch('read-all')
  markAllAsRead(@User() user: HUserDocument) {
    return this.notificationService.markAllAsRead(user._id.toString());
  }

  @Patch(':notificationId/read')
  markAsRead(
    @User() user: HUserDocument,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationService.markAsRead(
      user._id.toString(),
      notificationId,
    );
  }

  @Delete(':notificationId')
  remove(
    @User() user: HUserDocument,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationService.remove(user._id.toString(), notificationId);
  }
}
