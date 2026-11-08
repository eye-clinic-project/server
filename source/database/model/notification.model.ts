import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { User } from './user.model.js';
import { INotification } from '../../dependency/interface/database-schema.interface.js';
import { NotificationType } from '../../dependency/enum/database.enum.js';

export type HNotificationDocument = HydratedDocument<INotification>;

@Schema({
  timestamps: true,
  collection: 'notifications',
})
export class Notification {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  recipient: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  title: string;

  @Prop({
    required: true,
    trim: true,
  })
  body: string;

  @Prop({
    type: Boolean,
    default: false,
  })
  read: boolean;

  @Prop({
    type: String,
    enum: Object.values(NotificationType),
    default: NotificationType.SYSTEM,
  })
  type: NotificationType;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
