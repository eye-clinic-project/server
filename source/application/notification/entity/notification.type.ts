import type { Types } from 'mongoose';

import type { INotification } from '../../../dependencies/interface/database.interface.js';
import { NotificationEntity } from './notification.entity.js';

export type NotificationView = INotification & { _id: Types.ObjectId };

export interface NotificationPage {
  docs: NotificationEntity[];
  count: number;
  unreadCount: number;
  currentPage: number;
  size: number;
  pages: number;
}
