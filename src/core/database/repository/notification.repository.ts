import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DatabaseRepository } from './base.repository.js';
import { HNotificationDocument } from '../model/notification.model.js';

@Injectable()
export class NotificationRepository extends DatabaseRepository<HNotificationDocument> {
  constructor(
    @InjectModel(Notification.name) model: Model<HNotificationDocument>,
  ) {
    super(model);
  }

  countUnread(userId: Types.ObjectId | string) {
    return this.model
      .countDocuments({ recipient: userId, isRead: false })
      .exec();
  }

  markAllRead(userId: Types.ObjectId | string) {
    return this.updateMany({
      filter: { recipient: userId, isRead: false },
      update: { $set: { isRead: true } },
    });
  }
}
