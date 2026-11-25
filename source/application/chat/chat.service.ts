import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectDisk, StorageDisk } from '@nestjs/storage';
import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';

import { SystemRoleEnum } from '../../dependencies/enum/security.enum.js';
import type { IUser } from '../../dependencies/interface/database.interface.js';
import { LoggerService } from '../../dependencies/service/logger.service.js';
import { IsPatientAssignedQuery } from '../patient/custom/query/is-patient-assigned.query.js';
import { CreateMessageCommand } from './custom/command/create-message.command.js';
import { MarkReadCommand } from './custom/command/mark-read.command.js';
import { OpenConversationCommand } from './custom/command/open-conversation.command.js';
import { CountUnreadQuery } from './custom/query/count-unread.query.js';
import { FindConversationQuery } from './custom/query/find-conversation.query.js';
import { FindMessageQuery } from './custom/query/find-message.query.js';
import { ListConversationsQuery } from './custom/query/list-conversations.query.js';
import { ListMessagesQuery } from './custom/query/list-messages.query.js';
import type { AttachmentUploadDto } from './dto/attachment-upload.dto.js';
import { ListMessagesDto } from './dto/list-messages.dto.js';
import { ReadDto } from './dto/read.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { attachmentType, type ConversationView, type MessagePage } from './type/chat.type.js';
import { ConversationEntity, toConversationEntity } from './entity/conversation.entity.js';
import { MessageEntity, toMessageEntity } from './entity/message.entity.js';
import { CHAT_MESSAGE_SENT_EVENT, ChatMessageSentEvent } from './event/chat-message-sent.event.js';

const MAX_ATTACHMENT_MB = 5;
const MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_MB * 1024 * 1024;
const PREVIEW_LENGTH = 120;

const previewOf = (message: string): string | null =>
  !message ? null : message.length > PREVIEW_LENGTH ? `${message.slice(0, PREVIEW_LENGTH - 3)}...` : message;

const sniff = (data: Buffer): string | null => {
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'jpg';
  if (data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (data.length >= 5 && data.toString('ascii', 0, 5) === '%PDF-') return 'pdf';
  return null;
};

export interface SentMessage {
  conversation: ConversationView;
  message: MessageEntity;
}

@Injectable()
export class ChatService {
  private readonly baseUrl: string;

  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly loggerService: LoggerService,
    private readonly eventEmitter: EventEmitter2,
    @InjectDisk('private') private readonly disk: StorageDisk,
    configService: ConfigService,
  ) {
    this.baseUrl = (configService.get<string>('app.appUrl') ?? '').replace(/\/$/, '');
  }

  async startConversation(user: IUser, participantId: string): Promise<{ created: boolean; conversation: ConversationEntity }> {
    const me = idOf(user);
    const other = new Types.ObjectId(participantId);
    const [doctorId, patientId] = user.role === SystemRoleEnum.DOCTOR ? [me, other] : [other, me];
    await this.assertAssigned(doctorId, patientId);

    const { conversationId, created } = await this.commandBus.execute(new OpenConversationCommand(doctorId, patientId));
    const conversation = await this.loadConversation(conversationId);
    return { created, conversation: toConversationEntity(conversation, this.baseUrl) };
  }

  async listConversations(user: IUser): Promise<ConversationEntity[]> {
    const conversations = await this.queryBus.execute(new ListConversationsQuery(idOf(user)));
    const unread = await this.queryBus.execute(
      new CountUnreadQuery(
        idOf(user),
        conversations.map((conversation) => conversation._id),
      ),
    );
    return conversations
      .filter((conversation) => conversation.doctor && conversation.patient)
      .map((conversation) => toConversationEntity(conversation, this.baseUrl, unread.get(conversation._id.toString()) ?? 0));
  }

  async listMessages(user: IUser, conversationId: Types.ObjectId, { before, limit = 30 }: ListMessagesDto): Promise<MessagePage> {
    await this.accessConversation(user, conversationId);
    const messages = await this.queryBus.execute(new ListMessagesQuery(conversationId, limit, before));
    return {
      docs: messages.reverse().map((message) => toMessageEntity(message, this.baseUrl)),
      nextBefore: messages.length === limit ? messages[0].createdAt : null,
    };
  }

  async getAttachment(user: IUser, messageId: Types.ObjectId, index: number): Promise<{ key: string; contentType: string }> {
    const message = await this.queryBus.execute(new FindMessageQuery(messageId));
    const key = message?.attachments?.[index];
    if (!message || !key) throw new NotFoundException('File not found');
    await this.accessConversation(user, message.conversation);
    return { key, contentType: attachmentType(key) };
  }

  async accessConversation(user: IUser, conversationId: Types.ObjectId, { requireAssignment = false } = {}): Promise<ConversationView> {
    const conversation = await this.loadConversation(conversationId);
    if (!conversation.participants.some((participant) => participant.equals(idOf(user)))) throw new ForbiddenException('You are not part of this conversation');
    if (requireAssignment) await this.assertAssigned(conversation.doctor._id, conversation.patient._id);
    return conversation;
  }

  async sendMessage(user: IUser, { conversationId, message = '', attachments = [], clientId }: SendMessageDto): Promise<SentMessage> {
    if (!message && !attachments.length) throw new BadRequestException('Message must be 1-4000 characters');
    const conversation = await this.accessConversation(user, new Types.ObjectId(conversationId), { requireAssignment: true });

    const keys = await this.storeAttachments(conversation._id, attachments);
    const created = await this.commandBus.execute(new CreateMessageCommand(conversation._id, idOf(user), message, keys)).catch(async (error: unknown) => {
      await this.deleteFiles(keys);
      throw error;
    });
    const sender = idOf(user);
    const recipient = conversation.doctor._id.equals(sender) ? conversation.patient._id : conversation.doctor._id;
    this.eventEmitter.emit(
      CHAT_MESSAGE_SENT_EVENT,
      new ChatMessageSentEvent(
        conversation._id.toString(),
        created._id.toString(),
        sender.toString(),
        user.name,
        recipient.toString(),
        previewOf(created.message),
      ),
    );
    return { conversation, message: toMessageEntity(created, this.baseUrl, clientId) };
  }

  async markRead(user: IUser, { conversationId, messageId }: ReadDto): Promise<{ conversation: ConversationView; count: number; upTo: Date }> {
    const conversation = await this.accessConversation(user, new Types.ObjectId(conversationId));
    let upTo = new Date();
    if (messageId) {
      const message = await this.queryBus.execute(new FindMessageQuery(new Types.ObjectId(messageId)));
      if (!message || !message.conversation.equals(conversation._id)) throw new NotFoundException('File not found');
      upTo = message.createdAt;
    }
    const count = await this.commandBus.execute(new MarkReadCommand(conversation._id, idOf(user), upTo));
    return { conversation, count, upTo };
  }

  private async storeAttachments(conversationId: Types.ObjectId, attachments: AttachmentUploadDto[]): Promise<string[]> {
    const files = attachments.map(({ data }) => {
      if (data.length > MAX_ATTACHMENT_BYTES) throw new BadRequestException(`Each attachment can be at most ${MAX_ATTACHMENT_MB} MB`);
      const extension = sniff(data);
      if (!extension) throw new BadRequestException('Attachments must be JPEG, PNG, WebP or PDF files');
      return { data, key: `chat/${conversationId.toString()}/${randomUUID()}.${extension}` };
    });

    const stored: string[] = [];
    try {
      for (const file of files) {
        await this.disk.put(file.key, file.data, { contentType: attachmentType(file.key), contentLength: file.data.length });
        stored.push(file.key);
      }
      return stored;
    } catch (error) {
      await this.deleteFiles(stored);
      throw error;
    }
  }

  private async deleteFiles(keys: string[]): Promise<void> {
    if (keys.length) await this.disk.delete(keys).catch((error: unknown) => this.loggerService.warn(error));
  }

  private async loadConversation(conversationId: Types.ObjectId): Promise<ConversationView> {
    const conversation = await this.queryBus.execute(new FindConversationQuery(conversationId));
    if (!conversation?.doctor || !conversation.patient) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  private async assertAssigned(doctorId: Types.ObjectId, patientId: Types.ObjectId): Promise<void> {
    const assigned = await this.queryBus.execute(new IsPatientAssignedQuery(doctorId, patientId));
    if (!assigned) throw new ForbiddenException('Chat is only available between a doctor and their assigned patient');
  }

  get attachmentDisk(): StorageDisk {
    return this.disk;
  }
}

const idOf = (user: IUser): Types.ObjectId => new Types.ObjectId(user._id);
