import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Types } from 'mongoose';

import type { IUser } from '../../dependencies/interface/database.interface.js';
import { DeleteNotificationCommand } from './custom/command/delete-notification.command.js';
import { MarkAllNotificationsReadCommand } from './custom/command/mark-all-notifications-read.command.js';
import { MarkNotificationReadCommand } from './custom/command/mark-notification-read.command.js';
import { CountUnreadNotificationsQuery } from './custom/query/count-unread-notifications.query.js';
import { ListNotificationsQuery } from './custom/query/list-notifications.query.js';
import { ListNotificationsDto } from './dto/list-notifications.dto.js';
import { NotificationEntity, toNotificationEntity } from './entity/notification.entity.js';
import type { NotificationPage } from './type/notification.type.js';

@Injectable()
export class NotificationInboxService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  async list(user: IUser, { unread, page = 1, size = 20 }: ListNotificationsDto): Promise<NotificationPage> {
    const recipient = idOf(user);
    const [result, unreadCount] = await Promise.all([
      this.queryBus.execute(new ListNotificationsQuery(recipient, page, size, unread)),
      this.queryBus.execute(new CountUnreadNotificationsQuery(recipient)),
    ]);
    return { ...result, unreadCount, docs: result.docs.map((notification) => toNotificationEntity(notification)) };
  }

  async unreadCount(user: IUser): Promise<{ unreadCount: number }> {
    return { unreadCount: await this.queryBus.execute(new CountUnreadNotificationsQuery(idOf(user))) };
  }

  async markRead(user: IUser, notificationId: Types.ObjectId): Promise<NotificationEntity> {
    const notification = await this.commandBus.execute(new MarkNotificationReadCommand(idOf(user), notificationId));
    if (!notification) throw new NotFoundException('Notification not found');
    return toNotificationEntity(notification);
  }

  async markAllRead(user: IUser): Promise<{ updated: number }> {
    return { updated: await this.commandBus.execute(new MarkAllNotificationsReadCommand(idOf(user))) };
  }

  async remove(user: IUser, notificationId: Types.ObjectId): Promise<void> {
    const deleted = await this.commandBus.execute(new DeleteNotificationCommand(idOf(user), notificationId));
    if (!deleted) throw new NotFoundException('Notification not found');
  }
}

const idOf = (user: IUser): Types.ObjectId => new Types.ObjectId(user._id);
