import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import type { HUserDocument } from '../../database/model/user.model.js';
import { ConversationRepository } from '../../database/repository/conversation.repository.js';
import { MessageRepository } from '../../database/repository/message.repository.js';
import { UserRepository } from '../../database/repository/user.repository.js';
import { DoctorPatientRepository } from '../../database/repository/doctor-patient.repository.js';
import { NotifierService } from '../../dependency/service/notifier.service.js';
import { RealtimeService, conversationRoom } from '../../dependency/service/realtime.service.js';
import { NotificationType } from '../../dependency/enum/database.enum.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { presentUser } from '../../dependency/presenter.js';
import { MessagesQueryDto } from './dto/conversation.dto.js';

export const presentMessage = (m: any) => ({
  id: m._id.toString(),
  _id: m._id.toString(),
  conversation: m.conversation.toString(),
  sender: m.sender?._id?.toString?.() ?? m.sender.toString(),
  message: m.deletedAt ? '' : m.message,
  attachments: m.attachments ?? [],
  readBy: (m.readBy ?? []).map((id: Types.ObjectId) => id.toString()),
  deletedAt: m.deletedAt ?? null,
  editedAt: m.editedAt ?? null,
  createdAt: m.createdAt,
});

/** FR6.1: chat is only allowed between a doctor and their actively assigned patient. */
@Injectable()
export class ConversationService {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly messages: MessageRepository,
    private readonly users: UserRepository,
    private readonly assignments: DoctorPatientRepository,
    private readonly notifier: NotifierService,
    private readonly realtime: RealtimeService,
  ) {}

  private async assertCanChat(doctorId: Types.ObjectId, patientId: Types.ObjectId) {
    if (!(await this.assignments.isActiveAssignment(doctorId, patientId))) {
      throw new ForbiddenException('Chat is only available between a doctor and their assigned patient');
    }
  }

  async create(actor: HUserDocument, participantId: Types.ObjectId) {
    const other = await this.users.findById({ _id: participantId });
    if (!other) throw new NotFoundException('User not found');
    let doctor: Types.ObjectId;
    let patient: Types.ObjectId;
    if (actor.role === SystemRoleEnum.DOCTOR && other.role === SystemRoleEnum.PATIENT) {
      doctor = actor._id;
      patient = other._id;
    } else if (actor.role === SystemRoleEnum.PATIENT && other.role === SystemRoleEnum.DOCTOR) {
      doctor = other._id;
      patient = actor._id;
    } else {
      throw new BadRequestException('A conversation must be between a doctor and a patient');
    }
    await this.assertCanChat(doctor, patient);
    const conversation = await this.conversations.findOneAndUpdate({
      filter: { doctor, patient },
      update: { $setOnInsert: { doctor, patient, participants: [doctor, patient] } },
      options: { upsert: true, new: true },
    });
    return this.findOne(actor, conversation!._id);
  }

  /** Loads a conversation the user participates in (admins may read any). */
  async load(actor: HUserDocument, id: Types.ObjectId) {
    const conversation = await this.conversations.findById({ _id: id });
    if (!conversation) throw new NotFoundException('Conversation not found');
    const isParticipant = conversation.participants.some((p) => p.equals(actor._id));
    if (!isParticipant && actor.role !== SystemRoleEnum.ADMIN) {
      throw new ForbiddenException('You are not part of this conversation');
    }
    return conversation;
  }

  private async present(actor: HUserDocument, c: any) {
    const otherId = c.participants.find((p: any) => !(p._id ?? p).equals(actor._id)) ?? c.participants[0];
    const [other, lastMessage, unread] = await Promise.all([
      this.users.findById({ _id: otherId._id ?? otherId, options: { lean: true } }),
      c.lastMessage ? this.messages.findById({ _id: c.lastMessage, options: { lean: true } }) : null,
      this.messages.typedModel.countDocuments({ conversation: c._id, sender: { $ne: actor._id }, readBy: { $ne: actor._id }, deletedAt: null }),
    ]);
    return {
      id: c._id.toString(),
      _id: c._id.toString(),
      doctor: c.doctor.toString(),
      patient: c.patient.toString(),
      participant: presentUser(other),
      lastMessage: lastMessage ? presentMessage(lastMessage) : null,
      lastMessageAt: c.lastMessageAt ?? null,
      unreadCount: unread,
      canSend: !!(await this.assignments.isActiveAssignment(c.doctor, c.patient)),
      createdAt: c.createdAt,
    };
  }

  async list(actor: HUserDocument) {
    const rows = await this.conversations.find({
      filter: { participants: actor._id },
      options: { sort: { lastMessageAt: -1, updatedAt: -1 }, lean: true },
    });
    return Promise.all(rows.map((c) => this.present(actor, c)));
  }

  async findOne(actor: HUserDocument, id: Types.ObjectId) {
    const c = await this.load(actor, id);
    return this.present(actor, c.toObject());
  }

  async listMessages(actor: HUserDocument, id: Types.ObjectId, query: MessagesQueryDto) {
    await this.load(actor, id);
    const filter: Record<string, unknown> = { conversation: id };
    if (query.before) filter.createdAt = { $lt: query.before };
    const limit = query.limit ?? 30;
    const rows = await this.messages.find({ filter, options: { sort: { createdAt: -1 }, limit: limit + 1, lean: true } });
    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit).reverse().map(presentMessage);
    return { items, hasMore, nextBefore: hasMore ? items[0]?.createdAt : null };
  }

  /** Saves a message and pushes it to both users in real time. */
  async send(actor: HUserDocument, id: Types.ObjectId, text: string) {
    const conversation = await this.load(actor, id);
    if (!conversation.participants.some((p) => p.equals(actor._id))) {
      throw new ForbiddenException('You are not part of this conversation');
    }
    await this.assertCanChat(conversation.doctor, conversation.patient);
    const message = await this.messages.create({
      data: { conversation: id, sender: actor._id, message: text, attachments: [], readBy: [actor._id], deliveredTo: [] },
    });
    await this.conversations.updateOne({
      filter: { _id: id },
      update: { $set: { lastMessage: message._id, lastMessageAt: message.createdAt } },
    });
    const payload = presentMessage(message.toObject());
    this.realtime.emitToRoom(conversationRoom(id.toString()), 'receive_message', payload);

    const recipient = conversation.participants.find((p) => !p.equals(actor._id))!;
    // Also reaches the recipient when they are not inside the conversation room.
    this.realtime.emitToUser(recipient.toString(), 'conversation_updated', { conversationId: id.toString(), message: payload });
    await this.notifier.notify({
      recipient,
      type: NotificationType.MESSAGE,
      title: `New message from ${actor.role === SystemRoleEnum.DOCTOR ? 'Dr. ' : ''}${actor.name}`,
      body: text.length > 80 ? `${text.slice(0, 77)}...` : text,
      link: `/${actor.role === SystemRoleEnum.DOCTOR ? 'patient' : 'doctor'}/messages?c=${id.toString()}`,
      resourceId: id,
    });
    return payload;
  }

  async markRead(actor: HUserDocument, id: Types.ObjectId) {
    await this.load(actor, id);
    const result = await this.messages.updateMany({
      filter: { conversation: id, readBy: { $ne: actor._id } },
      update: { $addToSet: { readBy: actor._id } },
    });
    this.realtime.emitToRoom(conversationRoom(id.toString()), 'message_read', {
      conversationId: id.toString(),
      userId: actor._id.toString(),
      at: new Date(),
    });
    return { updated: result.modifiedCount };
  }

  async remove(actor: HUserDocument, id: Types.ObjectId) {
    await this.load(actor, id);
    await this.messages.deleteMany({ filter: { conversation: id } });
    await this.conversations.deleteOne({ filter: { _id: id } });
    return { deleted: true };
  }
}
