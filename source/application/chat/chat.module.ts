import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule, ServiceModule } from '../../dependencies/module/index.js';
import { ChatController } from './chat.controller.js';
import { ChatGateway } from './chat.gateway.js';
import { ChatPresence } from './chat.presence.js';
import { ChatService } from './chat.service.js';
import {
  CountUnreadHandler,
  CreateMessageHandler,
  FindConversationHandler,
  FindMessageHandler,
  ListConversationsHandler,
  ListMessagesHandler,
  MarkReadHandler,
  OpenConversationHandler,
} from './cqrs/handler/index.js';
import { ChatListener } from './event/index.js';
import { CHAT_QUEUE, ChatProcessor } from './queue/index.js';

@Module({
  imports: [DatabaseModule, ServiceModule, BullModule.registerQueue({ name: CHAT_QUEUE })],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    ChatService,
    ChatPresence,
    ChatListener,
    ChatProcessor,
    FindConversationHandler,
    ListConversationsHandler,
    CountUnreadHandler,
    ListMessagesHandler,
    FindMessageHandler,
    OpenConversationHandler,
    CreateMessageHandler,
    MarkReadHandler,
  ],
})
export class ChatModule {}
