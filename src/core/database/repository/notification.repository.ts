import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DatabaseRepository } from './base.repository.js';
import { INotification } from '../../../common/interface/database-schema.interface.js';
import { Notification } from '../model/notification.model.js';

@Injectable()
export class NotificationRepository extends DatabaseRepository<INotification> {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<INotification>,
  ) {
    super(notificationModel);
  }

  async findByRecipient(
    recipientId: Types.ObjectId,
    limit = 20,
    skip = 0,
  ) {
    return this.notificationModel
      .find({ recipient: recipientId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async findUnread(recipientId: Types.ObjectId) {
    return this.notificationModel
      .find({
        recipient: recipientId,
        read: false,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async countUnread(recipientId: Types.ObjectId) {
    return this.notificationModel.countDocuments({
      recipient: recipientId,
      read: false,
    });
  }

  async markAsRead(
    notificationId: Types.ObjectId,
    recipientId: Types.ObjectId,
  ) {
    return this.notificationModel
      .findOneAndUpdate(
        {
          _id: notificationId,
          recipient: recipientId,
        },
        { $set: { read: true } },
        { new: true },
      )
      .exec();
  }

  async markAllAsRead(recipientId: Types.ObjectId) {
    return this.notificationModel.updateMany(
      {
        recipient: recipientId,
        read: false,
      },
      { $set: { read: true } },
    );
  }

  async deleteNotification(
    notificationId: Types.ObjectId,
    recipientId: Types.ObjectId,
  ) {
    return this.notificationModel
      .findOneAndDelete({
        _id: notificationId,
        recipient: recipientId,
      })
      .exec();
  }
}