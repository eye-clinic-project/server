import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Types } from 'mongoose';
import type { Server } from 'socket.io';
import type { IAuthSocket } from '../../dependency/interface/ctx.interface.js';
import { TokenService } from '../../dependency/service/token.service.js';
import { UtilService } from '../../dependency/service/util.service.js';
import { RealtimeService, conversationRoom, userRoom } from '../../dependency/service/realtime.service.js';
import { TokenEnum } from '../../dependency/enum/security.enum.js';
import { ConversationService } from './conversation.service.js';

type Ack<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

const isObjectId = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

/**
 * Socket.IO gateway (FR6.1). Connect with `auth: { token: "<access token>" }`.
 * Client → server: join_conversation, leave_conversation, send_message, typing, mark_read
 * Server → client: receive_message, message_read, typing, conversation_updated, notification
 */
@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class ConversationGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(ConversationGateway.name);

  constructor(
    private readonly tokens: TokenService,
    private readonly util: UtilService,
    private readonly realtime: RealtimeService,
    private readonly conversations: ConversationService,
  ) {}

  afterInit(server: Server) {
    this.realtime.attach(server);
    // Authenticate during the handshake, so no event can arrive before the user is known.
    server.use((socket, next) => {
      const client = socket as IAuthSocket;
      const raw = this.util.getAuthSocket(client);
      const token = raw?.startsWith('Bearer ') ? raw.slice(7) : raw;
      if (!token) return next(new Error('Unauthorized'));
      this.tokens
        .decodeToken({ token, tokenType: TokenEnum.ACCESS })
        .then((credentials) => {
          client.credentials = credentials;
          next();
        })
        .catch((error: Error) => {
          this.logger.debug(`Socket rejected: ${error.message}`);
          next(new Error('Unauthorized'));
        });
    });
  }

  async handleConnection(client: IAuthSocket) {
    if (!client.credentials) {
      client.disconnect(true);
      return;
    }
    await client.join(userRoom(client.credentials.user._id.toString()));
  }

  private async handle<T>(fn: () => Promise<T>): Promise<Ack<T>> {
    try {
      return { ok: true, data: await fn() };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('join_conversation')
  join(@ConnectedSocket() client: IAuthSocket, @MessageBody() body: { conversationId?: string }) {
    return this.handle(async () => {
      if (!isObjectId(body?.conversationId)) throw new Error('Invalid conversationId');
      await this.conversations.load(client.credentials.user, new Types.ObjectId(body.conversationId));
      await client.join(conversationRoom(body.conversationId));
      return { joined: body.conversationId };
    });
  }

  @SubscribeMessage('leave_conversation')
  leave(@ConnectedSocket() client: IAuthSocket, @MessageBody() body: { conversationId?: string }) {
    return this.handle(async () => {
      if (!isObjectId(body?.conversationId)) throw new Error('Invalid conversationId');
      await client.leave(conversationRoom(body.conversationId));
      return { left: body.conversationId };
    });
  }

  @SubscribeMessage('send_message')
  send(@ConnectedSocket() client: IAuthSocket, @MessageBody() body: { conversationId?: string; message?: string }) {
    return this.handle(async () => {
      if (!isObjectId(body?.conversationId)) throw new Error('Invalid conversationId');
      const text = typeof body.message === 'string' ? body.message.trim() : '';
      if (!text || text.length > 4000) throw new Error('Message must be 1-4000 characters');
      return this.conversations.send(client.credentials.user, new Types.ObjectId(body.conversationId), text);
    });
  }

  @SubscribeMessage('typing')
  async typing(@ConnectedSocket() client: IAuthSocket, @MessageBody() body: { conversationId?: string; isTyping?: boolean }) {
    if (!isObjectId(body?.conversationId)) return { ok: false, error: 'Invalid conversationId' };
    if (!client.rooms.has(conversationRoom(body.conversationId))) {
      return { ok: false, error: 'Join the conversation first' };
    }
    client.to(conversationRoom(body.conversationId)).emit('typing', {
      conversationId: body.conversationId,
      userId: client.credentials.user._id.toString(),
      isTyping: body.isTyping !== false,
    });
    return { ok: true, data: null };
  }

  @SubscribeMessage('mark_read')
  read(@ConnectedSocket() client: IAuthSocket, @MessageBody() body: { conversationId?: string }) {
    return this.handle(async () => {
      if (!isObjectId(body?.conversationId)) throw new Error('Invalid conversationId');
      return this.conversations.markRead(client.credentials.user, new Types.ObjectId(body.conversationId));
    });
  }
}
