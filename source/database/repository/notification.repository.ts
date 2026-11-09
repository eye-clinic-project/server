import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseRepository } from './base.repository.js';
import { Notification } from '../model/notification.model.js';
import { INotification } from '../../dependency/interface/database-schema.interface.js';

@Injectable()
export class NotificationRepository extends DatabaseRepository<INotification> {
  constructor(
    @InjectModel(Notification.name)
    readonly typedModel: Model<INotification>,
  ) {
    super(typedModel);
  }
}
