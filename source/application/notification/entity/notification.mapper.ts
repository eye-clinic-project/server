import type { NotificationView } from './notification.type.js';
import { NotificationEntity } from './notification.entity.js';

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
