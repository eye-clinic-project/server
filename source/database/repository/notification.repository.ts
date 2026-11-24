import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { INotification } from '../../dependencies/interface/database.interface.js';
import { Notification } from '../model/notification.model.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class NotificationRepository extends DatabaseRepository<INotification> {
  constructor(@InjectModel(Notification.name) private readonly notificationModel: Model<INotification>) {
    super(notificationModel);
  }
}
