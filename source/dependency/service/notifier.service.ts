import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { NotificationRepository } from '../../database/repository/notification.repository.js';
import { UserRepository } from '../../database/repository/user.repository.js';
import { NotificationType } from '../enum/database.enum.js';
import { MailService } from './mail.service.js';
import { RealtimeService } from './realtime.service.js';
import { UtilService } from './util.service.js';

export interface NotifyInput {
  recipient: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  resourceId?: Types.ObjectId | null;
  /** Also send an email (FR4.6). The email never contains the body, only a login link. */
  email?: boolean;
}

/** Creates in-app notifications, pushes them over Socket.IO and optionally emails them. */
@Injectable()
export class NotifierService {
  private readonly logger = new Logger(NotifierService.name);

  constructor(
    private readonly notifications: NotificationRepository,
    private readonly users: UserRepository,
    private readonly mail: MailService,
    private readonly realtime: RealtimeService,
    private readonly util: UtilService,
  ) {}

  async notify(input: NotifyInput) {
    const notification = await this.notifications.create({
      data: {
        recipient: input.recipient,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
        resourceId: input.resourceId ?? null,
        read: false,
      },
    });
    this.realtime.emitToUser(input.recipient.toString(), 'notification', notification.toJSON());

    if (input.email) {
      // Sent immediately in the background so the API call is not delayed.
      void this.sendEmail(notification._id, input).catch((error: Error) => this.logger.error(`Notification email failed: ${error.message}`));
    }
    return notification;
  }

  private async sendEmail(notificationId: Types.ObjectId, input: NotifyInput) {
    const user = await this.users.findById({ _id: input.recipient });
    if (!user || user.isActive === false) return;
    await this.mail.sendNotification(user.email, user.name, input.title, this.util.frontendUrl('/login'));
    await this.notifications.updateOne({
      filter: { _id: notificationId },
      update: { $set: { emailedAt: new Date() } },
    });
  }
}
