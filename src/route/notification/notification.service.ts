import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import { NotificationType } from '../../common/enum/schema.enum.js';
import { DoctorPatientRepository } from '../../core/database/repository/doctor-patient.repository.js';
import { NotificationRepository } from '../../core/database/repository/notification.repository.js';
import { UserRepository } from '../../core/database/repository/user.repository.js';
import { CreateNotificationDto } from './dto/create-notification.dto.js';

function objectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new NotFoundException('Notification or user not found');
  }
  return new Types.ObjectId(id);
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly users: UserRepository,
    private readonly assignments: DoctorPatientRepository,
  ) {}

  async notifyUser(
    recipientId: string | Types.ObjectId,
    notification: {
      title: string;
      body: string;
      type?: NotificationType;
    },
  ) {
    if (
      notification.type !== undefined &&
      !Object.values(NotificationType).includes(notification.type)
    ) {
      throw new BadRequestException('Invalid notification type');
    }
    if (
      typeof notification.title !== 'string' ||
      typeof notification.body !== 'string' ||
      !notification.title.trim() ||
      !notification.body.trim() ||
      notification.title.trim().length > 120 ||
      notification.body.trim().length > 2_000
    ) {
      throw new BadRequestException('Invalid notification title or body');
    }
    const recipientObjectId =
      typeof recipientId === 'string' ? objectId(recipientId) : recipientId;
    const recipient = await this.users.findHydratedById(recipientObjectId);
    if (
      !recipient ||
      (recipient.role !== UserRoleEnum.DOCTOR &&
        recipient.role !== UserRoleEnum.PATIENT)
    ) {
      throw new NotFoundException('Doctor or patient recipient not found');
    }

    return this.notifications.create({
      data: {
        recipient: recipientObjectId,
        title: notification.title.trim(),
        body: notification.body.trim(),
        type: notification.type ?? NotificationType.SYSTEM,
        read: false,
      },
    });
  }

  async sendToAssignedParticipant(
    senderId: string,
    dto: CreateNotificationDto,
  ) {
    const senderObjectId = objectId(senderId);
    const recipientObjectId = objectId(dto.recipientId);
    const [sender, recipient] = await Promise.all([
      this.users.findHydratedById(senderObjectId),
      this.users.findHydratedById(recipientObjectId),
    ]);

    if (
      !sender ||
      !recipient ||
      (sender.role !== UserRoleEnum.DOCTOR &&
        sender.role !== UserRoleEnum.PATIENT) ||
      (recipient.role !== UserRoleEnum.DOCTOR &&
        recipient.role !== UserRoleEnum.PATIENT)
    ) {
      throw new NotFoundException('Doctor or patient not found');
    }

    const doctorId =
      sender.role === UserRoleEnum.DOCTOR ? senderObjectId : recipientObjectId;
    const patientId =
      sender.role === UserRoleEnum.PATIENT ? senderObjectId : recipientObjectId;
    if (
      sender.role === recipient.role ||
      !(await this.assignments.isAssigned(doctorId, patientId))
    ) {
      throw new ForbiddenException(
        'Notifications can only be sent to an assigned doctor or patient',
      );
    }

    return this.notifyUser(recipientObjectId, dto);
  }

  findForUser(userId: string, limit = 20, skip = 0) {
    return this.notifications.findByRecipient(
      objectId(userId),
      Math.min(Math.max(Math.floor(limit), 1), 100),
      Math.max(Math.floor(skip), 0),
    );
  }

  findUnreadForUser(userId: string) {
    return this.notifications.findUnread(objectId(userId));
  }

  countUnreadForUser(userId: string) {
    return this.notifications.countUnread(objectId(userId));
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.notifications.markAsRead(
      objectId(notificationId),
      objectId(userId),
    );
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }

  async markAllAsRead(userId: string) {
    const result = await this.notifications.markAllAsRead(objectId(userId));
    return { modifiedCount: result.modifiedCount };
  }

  async remove(userId: string, notificationId: string) {
    const notification = await this.notifications.deleteNotification(
      objectId(notificationId),
      objectId(userId),
    );
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return { deleted: true };
  }
}
