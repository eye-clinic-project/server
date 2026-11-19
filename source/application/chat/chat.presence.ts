import { Injectable } from '@nestjs/common';
import type { Types } from 'mongoose';
import type { Namespace } from 'socket.io';

export const conversationRoom = (conversationId: string | Types.ObjectId) => `conversation:${conversationId.toString()}`;
export const userRoom = (userId: string | Types.ObjectId) => `user:${userId.toString()}`;

@Injectable()
export class ChatPresence {
  private server: Namespace | null = null;

  attach(server: Namespace): void {
    this.server = server;
  }

  async isViewing(conversationId: string, userId: string): Promise<boolean> {
    if (!this.server) return false;
    const viewers = await this.server.in(conversationRoom(conversationId)).fetchSockets();
    return viewers.some((socket) => (socket.data as { userId?: string } | undefined)?.userId === userId);
  }
}
