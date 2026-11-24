import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { OnEvent } from '@nestjs/event-emitter';

import { CHAT_MESSAGE_SENT_EVENT, ChatMessageSentEvent } from './chat-message-sent.event.js';
import { CHAT_QUEUE, ChatJob, type PushNewMessageJob } from '../queue/chat.queue.js';
import { LoggerService } from '../../../dependencies/service/logger.service.js';

@Injectable()
export class ChatListener {
  constructor(
    private readonly loggerService: LoggerService,
    @InjectQueue(CHAT_QUEUE) private readonly chatQueue: Queue<PushNewMessageJob>,
  ) {}

  @OnEvent(CHAT_MESSAGE_SENT_EVENT)
  async handleMessageSent({ conversationId, messageId, recipientId, senderName, preview }: ChatMessageSentEvent): Promise<void> {
    try {
      await this.chatQueue.add(
        ChatJob.PUSH_NEW_MESSAGE,
        { conversationId, messageId, recipientId, senderName, preview },
        { deduplication: { id: `${ChatJob.PUSH_NEW_MESSAGE}-${messageId}` } },
      );
    } catch (error: unknown) {
      this.loggerService.warn(error);
    }
  }
}
