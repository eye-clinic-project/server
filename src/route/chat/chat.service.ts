import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import { ConversationRepository } from '../../core/database/repository/conversation.repository.js';
import { DoctorPatientRepository } from '../../core/database/repository/doctor-patient.repository.js';
import { MessageRepository } from '../../core/database/repository/message.repository.js';
import { UserRepository } from '../../core/database/repository/user.repository.js';

function objectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new NotFoundException('Conversation or message not found');
  }
  return new Types.ObjectId(id);
}

@Injectable()
export class ChatService {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly messages: MessageRepository,
    private readonly doctorPatients: DoctorPatientRepository,
    private readonly users: UserRepository,
  ) {}

  async startConversation(userId: string, participantId: string) {
    const firstId = objectId(userId);
    const secondId = objectId(participantId);
    if (firstId.equals(secondId)) {
      throw new BadRequestException(
        'You cannot start a conversation with yourself',
      );
    }

    await this.assertAssignedPair(firstId, secondId);
    const existing = await this.conversations.findBetweenUsers(
      firstId,
      secondId,
    );
    if (existing) {
      return existing;
    }

    const participants = [firstId, secondId].sort((a, b) =>
      a.toString().localeCompare(b.toString()),
    );
    const conversation = await this.conversations.create({
      data: { participants },
    });
    const populated = await this.conversations.findBetweenUsers(
      firstId,
      secondId,
    );
    return populated ?? conversation;
  }

  async findConversations(userId: string) {
    const id = objectId(userId);
    const conversations = await this.conversations.findByParticipant(id);
    const active: typeof conversations = [];
    for (const conversation of conversations) {
      const participantIds = conversation.participants.map((participant) =>
        String(
          typeof participant === 'object' && '_id' in participant
            ? participant._id
            : participant,
        ),
      );
      if (
        participantIds.length === 2 &&
        (await this.isAssignedPair(
          objectId(participantIds[0]),
          objectId(participantIds[1]),
        ))
      ) {
        active.push(conversation);
      }
    }
    return active;
  }

  async findMessages(
    userId: string,
    conversationId: string,
    limit = 30,
    skip = 0,
  ) {
    const conversation = await this.requireConversation(userId, conversationId);
    const boundedLimit = Math.min(Math.max(Math.floor(limit), 1), 100);
    const boundedSkip = Math.max(Math.floor(skip), 0);
    const messages = await this.messages.findByConversation(
      conversation._id,
      boundedLimit,
      boundedSkip,
    );
    return messages.reverse();
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    input: { message?: string; attachments?: string[] },
  ) {
    const senderId = objectId(userId);
    if (input.message !== undefined && typeof input.message !== 'string') {
      throw new BadRequestException('Message must be a string');
    }
    const content = input.message?.trim() ?? '';
    const attachments = input.attachments ?? [];
    if (
      !Array.isArray(attachments) ||
      attachments.length > 10 ||
      attachments.some(
        (attachment) =>
          typeof attachment !== 'string' || attachment.length > 2_048,
      )
    ) {
      throw new BadRequestException('Invalid message attachments');
    }
    if (content.length > 5_000) {
      throw new BadRequestException('Message cannot exceed 5000 characters');
    }
    if (!content && attachments.length === 0) {
      throw new BadRequestException(
        'A message or at least one attachment is required',
      );
    }

    const conversation = await this.requireConversation(userId, conversationId);
    const message = await this.messages.create({
      data: {
        conversation: conversation._id,
        sender: senderId,
        message: content,
        attachments,
        deliveredTo: [],
        readBy: [],
      },
    });
    const messageId = objectId(String(message._id));
    await this.conversations.updateLastMessage(conversation._id, messageId);
    return this.messages.findById({
      _id: messageId,
      options: { populate: [{ path: 'sender' }] },
    });
  }

  async markDelivered(userId: string, conversationId: string) {
    const conversation = await this.requireConversation(userId, conversationId);
    return this.messages.markAsDelivered(conversation._id, objectId(userId));
  }

  async markRead(userId: string, conversationId: string) {
    const conversation = await this.requireConversation(userId, conversationId);
    return this.messages.markAsRead(conversation._id, objectId(userId));
  }

  async editMessage(userId: string, messageId: string, message: string) {
    if (typeof message !== 'string' || !message.trim()) {
      throw new BadRequestException('Message cannot be empty');
    }
    if (message.trim().length > 5_000) {
      throw new BadRequestException('Message cannot exceed 5000 characters');
    }
    const senderId = objectId(userId);
    const current = await this.messages.findByIdForSender(
      objectId(messageId),
      senderId,
    );
    if (!current || current.deletedAt) {
      throw new NotFoundException('Message not found');
    }
    await this.requireConversation(userId, current.conversation.toString());

    const updated = await this.messages.editMessage(
      current._id,
      senderId,
      message.trim(),
    );
    if (!updated) {
      throw new NotFoundException('Message not found');
    }
    await this.conversations.touch(current.conversation);
    return updated;
  }

  async deleteMessage(userId: string, messageId: string) {
    const senderId = objectId(userId);
    const current = await this.messages.findByIdForSender(
      objectId(messageId),
      senderId,
    );
    if (!current || current.deletedAt) {
      throw new NotFoundException('Message not found');
    }
    await this.requireConversation(userId, current.conversation.toString());

    const deleted = await this.messages.softDeleteMessage(
      current._id,
      senderId,
    );
    if (!deleted) {
      throw new NotFoundException('Message not found');
    }
    await this.conversations.touch(current.conversation);
    return deleted;
  }

  async getConversationParticipantIds(
    userId: string,
    conversationId: string,
  ): Promise<string[]> {
    const conversation = await this.requireConversation(userId, conversationId);
    return conversation.participants.map((participant) =>
      participant.toString(),
    );
  }

  private async requireConversation(userId: string, conversationId: string) {
    const conversation = await this.conversations.findParticipantConversation(
      objectId(conversationId),
      objectId(userId),
    );
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    const participantIds = conversation.participants;
    if (
      participantIds.length !== 2 ||
      !(await this.isAssignedPair(participantIds[0], participantIds[1]))
    ) {
      throw new ForbiddenException(
        'Chat is available only to an assigned doctor and patient',
      );
    }
    return conversation;
  }

  private async assertAssignedPair(
    firstUserId: Types.ObjectId,
    secondUserId: Types.ObjectId,
  ) {
    if (!(await this.isAssignedPair(firstUserId, secondUserId))) {
      throw new ForbiddenException(
        'Chat is available only to an assigned doctor and patient',
      );
    }
  }

  private async isAssignedPair(
    firstUserId: Types.ObjectId,
    secondUserId: Types.ObjectId,
  ) {
    const [first, second] = await Promise.all([
      this.users.findHydratedById(firstUserId),
      this.users.findHydratedById(secondUserId),
    ]);
    if (!first || !second) {
      return false;
    }

    const doctorId =
      first.role === UserRoleEnum.DOCTOR
        ? firstUserId
        : second.role === UserRoleEnum.DOCTOR
          ? secondUserId
          : null;
    const patientId =
      first.role === UserRoleEnum.PATIENT
        ? firstUserId
        : second.role === UserRoleEnum.PATIENT
          ? secondUserId
          : null;
    if (!doctorId || !patientId) {
      return false;
    }
    return Boolean(await this.doctorPatients.isAssigned(doctorId, patientId));
  }
}
