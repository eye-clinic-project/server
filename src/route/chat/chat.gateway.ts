import {
  BadRequestException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import { TokenService } from '../../common/service/token.service.js';
import { UtilService } from '../../common/service/util.service.js';
import { ChatService } from './chat.service.js';

type AuthenticatedSocket = Socket & {
  data: { userId: string; role: UserRoleEnum };
};

const userRoom = (userId: string) => `user:${userId}`;
const conversationRoom = (conversationId: string) => `conversation:${conversationId}`;

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly chat: ChatService,
    private readonly tokens: TokenService,
    private readonly util: UtilService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const credential = this.util.getAuthSocket(client);
      if (!credential) {
        throw new UnauthorizedException('Missing socket authorization');
      }

      const token = credential.replace(/^Bearer\s+/i, '').trim();
      const { user } = await this.tokens.decodeToken({ token });
      client.data.userId = user._id.toString();
      client.data.role = user.role;
      await client.join(userRoom(client.data.userId));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Socket authentication failed';
      this.logger.warn(`Rejected chat socket ${client.id}: ${message}`);
      client.emit('chat:error', { message: 'Socket authentication failed' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.debug(`Chat socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('conversation:join')
  async joinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { conversationId?: string },
  ) {
    const conversationId = this.requireConversationId(body);
    const participants = await this.chat.getConversationParticipantIds(
      client.data.userId,
      conversationId,
    );
    await client.join(conversationRoom(conversationId));
    const result = await this.chat.markDelivered(
      client.data.userId,
      conversationId,
    );
    if (result.modifiedCount > 0) {
      this.emitToParticipants(participants, 'message:delivered', {
        conversationId,
        userId: client.data.userId,
        count: result.modifiedCount,
      });
    }
    return { conversationId, joined: true };
  }

  @SubscribeMessage('conversation:leave')
  async leaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { conversationId?: string },
  ) {
    const conversationId = this.requireConversationId(body);
    await this.chat.getConversationParticipantIds(
      client.data.userId,
      conversationId,
    );
    await client.leave(conversationRoom(conversationId));
    return { conversationId, left: true };
  }

  @SubscribeMessage('message:send')
  async sendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    body: {
      conversationId?: string;
      message?: string;
      attachments?: string[];
    },
  ) {
    const conversationId = this.requireConversationId(body);
    const message = await this.chat.sendMessage(
      client.data.userId,
      conversationId,
      { message: body.message, attachments: body.attachments },
    );
    const participants = await this.chat.getConversationParticipantIds(
      client.data.userId,
      conversationId,
    );
    this.emitToParticipants(participants, 'message:new', message);

    const recipientId = participants.find(
      (participantId) => participantId !== client.data.userId,
    );
    if (recipientId) {
      const connected = await this.server
        .in(userRoom(recipientId))
        .fetchSockets();
      if (connected.length > 0) {
        const delivery = await this.chat.markDelivered(
          recipientId,
          conversationId,
        );
        if (delivery.modifiedCount > 0) {
          this.emitToParticipants(participants, 'message:delivered', {
            conversationId,
            userId: recipientId,
            count: delivery.modifiedCount,
          });
        }
      }
    }
    return message;
  }

  @SubscribeMessage('message:read')
  async markRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { conversationId?: string },
  ) {
    const conversationId = this.requireConversationId(body);
    const participants = await this.chat.getConversationParticipantIds(
      client.data.userId,
      conversationId,
    );
    const result = await this.chat.markRead(client.data.userId, conversationId);
    if (result.modifiedCount > 0) {
      this.emitToParticipants(participants, 'message:read', {
        conversationId,
        userId: client.data.userId,
        count: result.modifiedCount,
      });
    }
    return { conversationId, modifiedCount: result.modifiedCount };
  }

  @SubscribeMessage('message:edit')
  async editMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { messageId?: string; message?: string },
  ) {
    if (
      !body ||
      typeof body.messageId !== 'string' ||
      typeof body.message !== 'string'
    ) {
      throw new BadRequestException('messageId and message are required');
    }
    const updated = await this.chat.editMessage(
      client.data.userId,
      body.messageId,
      body.message,
    );
    const conversationId = updated.conversation.toString();
    const participants = await this.chat.getConversationParticipantIds(
      client.data.userId,
      conversationId,
    );
    this.emitToParticipants(participants, 'message:updated', updated);
    return updated;
  }

  @SubscribeMessage('message:delete')
  async deleteMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { messageId?: string },
  ) {
    if (!body || typeof body.messageId !== 'string') {
      throw new BadRequestException('messageId is required');
    }
    const deleted = await this.chat.deleteMessage(
      client.data.userId,
      body.messageId,
    );
    const conversationId = deleted.conversation.toString();
    const participants = await this.chat.getConversationParticipantIds(
      client.data.userId,
      conversationId,
    );
    this.emitToParticipants(participants, 'message:deleted', deleted);
    return deleted;
  }

  private requireConversationId(body: { conversationId?: string }) {
    if (
      !body ||
      typeof body.conversationId !== 'string' ||
      !body.conversationId.trim()
    ) {
      throw new BadRequestException('conversationId is required');
    }
    return body.conversationId;
  }

  private emitToParticipants(
    participantIds: string[],
    event: string,
    payload: unknown,
  ) {
    for (const participantId of participantIds) {
      this.server.to(userRoom(participantId)).emit(event, payload);
    }
  }
}
