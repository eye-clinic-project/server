import type { Types } from 'mongoose';

import type { NotificationType } from '../../../dependencies/enum/database.enum.js';
import type { NotificationView } from './notification.type.js';

export class NotificationEntity {
  constructor(
    public readonly _id: Types.ObjectId,
    public readonly type: NotificationType,
    public readonly title: string,
    public readonly body: string,
    public readonly link: string | null,
    public readonly resourceId: Types.ObjectId | null,
    public readonly read: boolean,
    public readonly readAt: Date | null,
    public readonly createdAt?: Date,
  ) {}
}

export const toNotificationEntity = (notification: NotificationView): NotificationEntity =>
  new NotificationEntity(
    notification._id,
    notification.type,
    notification.title,
    notification.body,
    notification.link ?? null,
    notification.resourceId ?? null,
    notification.read,
    notification.readAt ?? null,
    notification.createdAt,
  );
