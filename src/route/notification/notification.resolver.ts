import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { InternalServerErrorException } from '@nestjs/common';
import { Auth } from '../../common/decorator/auth.decorator.js';
import { User } from '../../common/decorator/user.decorator.js';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import type { HUserDocument } from '../../core/database/model/user.model.js';
import { NotificationType } from '../../common/enum/schema.enum.js';
import { NotificationService } from './notification.service.js';
import {
  DeleteNotificationResult,
  MarkNotificationsReadResult,
  NotificationGraphqlType,
  SendNotificationInput,
} from './notification-graphql.types.js';

function toGraphqlNotification(value: unknown): NotificationGraphqlType {
  if (typeof value !== 'object' || value === null) {
    throw new InternalServerErrorException('Invalid notification record');
  }
  const notification = value as Record<string, unknown>;
  const id = notification._id;
  const recipient = notification.recipient;
  const type = notification.type;
  if (
    typeof id !== 'object' ||
    id === null ||
    !('toString' in id) ||
    typeof id.toString !== 'function' ||
    typeof recipient !== 'object' ||
    recipient === null ||
    !('toString' in recipient) ||
    typeof recipient.toString !== 'function' ||
    typeof notification.title !== 'string' ||
    typeof notification.body !== 'string' ||
    typeof notification.read !== 'boolean' ||
    !Object.values(NotificationType).includes(type as NotificationType)
  ) {
    throw new InternalServerErrorException('Invalid notification record');
  }
  return {
    id: id.toString(),
    recipientId: recipient.toString(),
    title: notification.title,
    body: notification.body,
    read: notification.read,
    type: type as NotificationType,
    createdAt:
      notification.createdAt instanceof Date ? notification.createdAt : null,
    updatedAt:
      notification.updatedAt instanceof Date ? notification.updatedAt : null,
  };
}

@Resolver(() => NotificationGraphqlType)
@Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
export class NotificationResolver {
  constructor(private readonly notifications: NotificationService) {}

  @Query(() => [NotificationGraphqlType], { name: 'myNotifications' })
  async findMine(
    @User() user: HUserDocument,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit: number,
    @Args('skip', { type: () => Int, nullable: true, defaultValue: 0 })
    skip: number,
  ) {
    const notifications = await this.notifications.findForUser(
      user._id.toString(),
      limit,
      skip,
    );
    return notifications.map((notification) =>
      toGraphqlNotification(notification),
    );
  }

  @Query(() => [NotificationGraphqlType], { name: 'myUnreadNotifications' })
  async findUnread(@User() user: HUserDocument) {
    const notifications = await this.notifications.findUnreadForUser(
      user._id.toString(),
    );
    return notifications.map((notification) =>
      toGraphqlNotification(notification),
    );
  }

  @Query(() => Int, { name: 'myUnreadNotificationCount' })
  countUnread(@User() user: HUserDocument) {
    return this.notifications.countUnreadForUser(user._id.toString());
  }

  @Mutation(() => NotificationGraphqlType)
  async sendNotification(
    @User() user: HUserDocument,
    @Args('input') input: SendNotificationInput,
  ) {
    const notification = await this.notifications.sendToAssignedParticipant(
      user._id.toString(),
      {
        ...input,
        type: input.type ?? NotificationType.SYSTEM,
      },
    );
    return toGraphqlNotification(notification);
  }

  @Mutation(() => NotificationGraphqlType)
  async markNotificationAsRead(
    @User() user: HUserDocument,
    @Args('notificationId', { type: () => ID }) notificationId: string,
  ) {
    const notification = await this.notifications.markAsRead(
      user._id.toString(),
      notificationId,
    );
    return toGraphqlNotification(notification);
  }

  @Mutation(() => MarkNotificationsReadResult)
  markAllNotificationsAsRead(@User() user: HUserDocument) {
    return this.notifications.markAllAsRead(user._id.toString());
  }

  @Mutation(() => DeleteNotificationResult)
  removeNotification(
    @User() user: HUserDocument,
    @Args('notificationId', { type: () => ID }) notificationId: string,
  ) {
    return this.notifications.remove(user._id.toString(), notificationId);
  }
}
