import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import { INotification } from '../../dependencies/interface/database.interface.js';
import { NotificationType } from '../../dependencies/enum/database.enum.js';

export type HNotificationDocument = HydratedDocument<INotification>;

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  recipient: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  body: string;

  @Prop({ type: Boolean, default: false })
  read: boolean;

  @Prop({ type: Date, default: null })
  readAt?: Date | null;

  @Prop({
    type: String,
    enum: Object.values(NotificationType),
    default: NotificationType.SYSTEM,
  })
  type: NotificationType;

  @Prop({ type: String, trim: true })
  link?: string;

  @Prop({ type: Types.ObjectId, default: null })
  resourceId?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  emailedAt?: Date | null;

  @Prop({ type: Date, default: null })
  pushedAt?: Date | null;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
