import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import type { HUserDocument } from '../../database/model/user.model.js';
import { NotificationRepository } from '../../database/repository/notification.repository.js';
import { NotificationQueryDto } from './dto/notification.dto.js';

const present = (n: any) => ({
  id: n._id.toString(),
  _id: n._id.toString(),
  type: n.type,
  title: n.title,
  body: n.body,
  link: n.link ?? null,
  resourceId: n.resourceId?.toString() ?? null,
  read: n.read,
  readAt: n.readAt ?? null,
  createdAt: n.createdAt,
});

@Injectable()
export class NotificationService {
  constructor(private readonly notifications: NotificationRepository) {}

  async list(user: HUserDocument, query: NotificationQueryDto) {
    const filter: Record<string, unknown> = { recipient: user._id };
    if (query.unread) filter.read = false;
    if (query.type) filter.type = query.type;
    const [page, unreadCount] = await Promise.all([
      this.notifications.paginate({ filter, options: { sort: { createdAt: -1 }, lean: true }, page: query.page, size: query.size }),
      this.notifications.typedModel.countDocuments({ recipient: user._id, read: false }),
    ]);
    return { items: page.docs.map(present), total: page.count, page: page.currentPage, size: page.size, pages: page.pages, unreadCount };
  }

  async findOne(user: HUserDocument, id: Types.ObjectId) {
    const n = await this.notifications.findOne({ filter: { _id: id, recipient: user._id }, options: { lean: true } });
    if (!n) throw new NotFoundException('Notification not found');
    return present(n);
  }

  async markRead(user: HUserDocument, id: Types.ObjectId) {
    const n = await this.notifications.findOneAndUpdate({
      filter: { _id: id, recipient: user._id },
      update: { $set: { read: true, readAt: new Date() } },
    });
    if (!n) throw new NotFoundException('Notification not found');
    return present(n);
  }

  async markAllRead(user: HUserDocument) {
    const result = await this.notifications.updateMany({
      filter: { recipient: user._id, read: false },
      update: { $set: { read: true, readAt: new Date() } },
    });
    return { updated: result.modifiedCount };
  }

  async remove(user: HUserDocument, id: Types.ObjectId) {
    const result = await this.notifications.deleteOne({ filter: { _id: id, recipient: user._id } });
    if (!result.deletedCount) throw new NotFoundException('Notification not found');
    return { deleted: true };
  }

  async removeAll(user: HUserDocument) {
    const result = await this.notifications.deleteMany({ filter: { recipient: user._id } });
    return { deleted: result.deletedCount };
  }
}
