import { UseFilters, UsePipes } from '@nestjs/common';
import { I18nValidationPipe } from '@nestjs/i18n';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
  type OnGatewayConnection,
  type OnGatewayInit,
} from '@nestjs/websockets';
import { WsAuthenticator } from '@nestjs/authentication';
import { Types } from 'mongoose';
import type { Namespace, Socket } from 'socket.io';

import { DoctorVerificationStatus, SystemRoleEnum } from '../../dependencies/enum/index.js';
import { WsExceptionsFilter } from '../../dependencies/exception/index.js';
import type { IUser } from '../../dependencies/interface/index.js';
import { ChatPresence, conversationRoom, userRoom } from './chat.presence.js';
import { ChatService } from './chat.service.js';
import { ConversationRoomDto, MAX_ATTACHMENTS, ReadDto, SendMessageDto, TypingDto } from './dto/index.js';
import type { ConversationView, MessageEntity } from './entity/index.js';
import { Auth, User } from '../../dependencies/decorator/index.js';

const { DOCTOR, PATIENT } = SystemRoleEnum;

const participantRooms = (conversation: ConversationView) => [
  conversationRoom(conversation._id),
  userRoom(conversation.doctor._id),
  userRoom(conversation.patient._id),
];

@WebSocketGateway({ namespace: '/chat', maxHttpBufferSize: (MAX_ATTACHMENTS * 5 + 1) * 1024 * 1024 })
@UseFilters(WsExceptionsFilter)
@UsePipes(new I18nValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Auth({ roles: [DOCTOR, PATIENT] })
export class ChatGateway implements OnGatewayConnection, OnGatewayInit {
  @WebSocketServer()
  private readonly server!: Namespace;

  constructor(
    private readonly chatService: ChatService,
    private readonly wsAuthenticator: WsAuthenticator,
    private readonly chatPresence: ChatPresence,
  ) {}

  afterInit(server: Namespace): void {
    this.chatPresence.attach(server);
  }

  async handleConnection(client: Socket): Promise<void> {
    const result = await this.wsAuthenticator.authenticateConnection(client);
    const user = result?.user as IUser | undefined;
    if (!user) return;
    const approvedDoctor = user.role === SystemRoleEnum.DOCTOR && user.doctorStatus === DoctorVerificationStatus.APPROVED;
    if (user.isActive === false || !(approvedDoctor || user.role === SystemRoleEnum.PATIENT)) {
      client.disconnect(true);
      return;
    }
    const userId = String(user._id);
    client.data = { ...(client.data as object), userId };
    await client.join(userRoom(userId));
  }

  @SubscribeMessage('join_conversation')
  async joinConversation(@ConnectedSocket() client: Socket, @User() user: IUser, @MessageBody() { conversationId }: ConversationRoomDto) {
    await this.chatService.accessConversation(user, new Types.ObjectId(conversationId), { requireAssignment: true });
    await client.join(conversationRoom(conversationId));
    return { status: 'ok', conversationId };
  }

  @SubscribeMessage('leave_conversation')
  async leaveConversation(@ConnectedSocket() client: Socket, @MessageBody() { conversationId }: ConversationRoomDto) {
    await client.leave(conversationRoom(conversationId));
    return { status: 'ok', conversationId };
  }

  @SubscribeMessage('send_message')
  async sendMessage(@User() user: IUser, @MessageBody() body: SendMessageDto): Promise<{ status: 'ok'; message: MessageEntity }> {
    const { conversation, message } = await this.chatService.sendMessage(user, body);
    this.server.to(participantRooms(conversation)).emit('new_message', message);
    return { status: 'ok', message };
  }

  @SubscribeMessage('typing')
  typing(@ConnectedSocket() client: Socket, @User() user: IUser, @MessageBody() { conversationId, isTyping }: TypingDto) {
    const room = conversationRoom(conversationId);
    if (!client.rooms.has(room)) throw new WsException('Join the conversation first');
    client.to(room).emit('typing', { conversationId, userId: String(user._id), isTyping });
    return { status: 'ok' };
  }

  @SubscribeMessage('read')
  async read(@User() user: IUser, @MessageBody() body: ReadDto) {
    const { conversation, count, upTo } = await this.chatService.markRead(user, body);
    if (count) this.server.to(participantRooms(conversation)).emit('read', { conversationId: body.conversationId, userId: String(user._id), upTo, count });
    return { status: 'ok', count, upTo };
  }
}
