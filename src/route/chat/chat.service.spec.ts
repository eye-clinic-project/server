import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import { ConversationRepository } from '../../core/database/repository/conversation.repository.js';
import { DoctorPatientRepository } from '../../core/database/repository/doctor-patient.repository.js';
import { MessageRepository } from '../../core/database/repository/message.repository.js';
import { UserRepository } from '../../core/database/repository/user.repository.js';
import { ChatService } from './chat.service.js';

describe('ChatService', () => {
  let service: ChatService;
  const conversations = {
    create: vi.fn(),
    findBetweenUsers: vi.fn(),
    findByParticipant: vi.fn(),
    findParticipantConversation: vi.fn(),
    updateLastMessage: vi.fn(),
    touch: vi.fn(),
  };
  const messages = {
    create: vi.fn(),
    findById: vi.fn(),
    findByConversation: vi.fn(),
    markAsDelivered: vi.fn(),
    markAsRead: vi.fn(),
    findByIdForSender: vi.fn(),
    editMessage: vi.fn(),
    softDeleteMessage: vi.fn(),
  };
  const doctorPatients = { isAssigned: vi.fn() };
  const users = { findHydratedById: vi.fn() };
  const doctorId = new Types.ObjectId();
  const patientId = new Types.ObjectId();
  const conversationId = new Types.ObjectId();

  beforeEach(async () => {
    vi.clearAllMocks();
    users.findHydratedById.mockImplementation(async (id: Types.ObjectId) => ({
      role: id.equals(doctorId) ? UserRoleEnum.DOCTOR : UserRoleEnum.PATIENT,
    }));
    doctorPatients.isAssigned.mockResolvedValue(true);
    conversations.findParticipantConversation.mockResolvedValue({
      _id: conversationId,
      participants: [doctorId, patientId],
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: ConversationRepository, useValue: conversations },
        { provide: MessageRepository, useValue: messages },
        { provide: DoctorPatientRepository, useValue: doctorPatients },
        { provide: UserRepository, useValue: users },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('creates a conversation only for an assigned doctor-patient pair', async () => {
    conversations.findBetweenUsers
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        _id: conversationId,
        participants: [doctorId, patientId],
      });
    conversations.create.mockResolvedValue({ _id: conversationId });

    await service.startConversation(doctorId.toString(), patientId.toString());

    expect(doctorPatients.isAssigned).toHaveBeenCalledWith(doctorId, patientId);
    expect(conversations.create).toHaveBeenCalledWith({
      data: { participants: [doctorId, patientId] },
    });
  });

  it('rejects conversations when the doctor-patient assignment is missing', async () => {
    doctorPatients.isAssigned.mockResolvedValue(false);

    await expect(
      service.startConversation(doctorId.toString(), patientId.toString()),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(conversations.create).not.toHaveBeenCalled();
  });

  it('rejects empty messages', async () => {
    await expect(
      service.sendMessage(doctorId.toString(), conversationId.toString(), {
        message: '  ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(messages.create).not.toHaveBeenCalled();
  });

  it('persists messages and updates the conversation preview', async () => {
    const messageId = new Types.ObjectId();
    const savedMessage = {
      _id: messageId,
      conversation: conversationId,
      sender: doctorId,
    };
    messages.create.mockResolvedValue(savedMessage);
    messages.findById.mockResolvedValue(savedMessage);

    await service.sendMessage(doctorId.toString(), conversationId.toString(), {
      message: '  Hello  ',
    });

    expect(messages.create).toHaveBeenCalledWith({
      data: {
        conversation: conversationId,
        sender: doctorId,
        message: 'Hello',
        attachments: [],
        deliveredTo: [],
        readBy: [],
      },
    });
    expect(conversations.updateLastMessage).toHaveBeenCalledWith(
      conversationId,
      messageId,
    );
  });

  it('records delivered and read receipts for incoming messages', async () => {
    messages.markAsDelivered.mockResolvedValue({ modifiedCount: 1 });
    messages.markAsRead.mockResolvedValue({ modifiedCount: 1 });

    await service.markDelivered(
      patientId.toString(),
      conversationId.toString(),
    );
    await service.markRead(patientId.toString(), conversationId.toString());

    expect(messages.markAsDelivered).toHaveBeenCalledWith(
      conversationId,
      patientId,
    );
    expect(messages.markAsRead).toHaveBeenCalledWith(conversationId, patientId);
  });
});
