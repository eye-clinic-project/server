import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

import { NotificationType } from '../../../dependencies/enum/database.enum.js';
import { NotificationService } from '../../../dependencies/service/notification.service.js';
import { ChatPresence } from '../chat.presence.js';

export const CHAT_QUEUE = 'chat';

export enum ChatJob {
  PUSH_NEW_MESSAGE = 'push-new-message',
}

export interface PushNewMessageJob {
  conversationId: string;
  messageId: string;
  recipientId: string;
  senderName: string;
  preview: string | null;
}

@Processor(CHAT_QUEUE)
export class ChatProcessor extends WorkerHost {
  constructor(
    private readonly chatPresence: ChatPresence,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<PushNewMessageJob>): Promise<void> {
    switch (job.name) {
      case ChatJob.PUSH_NEW_MESSAGE:
        await this.pushNewMessage(job.data);
        break;
    }
  }

  private async pushNewMessage({ conversationId, messageId, recipientId, senderName, preview }: PushNewMessageJob): Promise<void> {
    if (await this.chatPresence.isViewing(conversationId, recipientId)) return;
    await this.notificationService.notify({
      recipient: recipientId,
      type: NotificationType.MESSAGE,
      template: 'newMessage',
      args: { sender: senderName, preview: preview ?? { key: 'attachmentPreview' } },
      link: `/chat/conversations/${conversationId}`,
      resourceId: conversationId,
      persist: false,
      data: { conversationId, messageId },
    });
  }
}
