import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule } from '../../dependencies/module/database.module.js';
import { ServiceModule } from '../../dependencies/module/service.module.js';
import { ChatController } from './chat.controller.js';
import { ChatGateway } from './chat.gateway.js';
import { ChatPresence } from './chat.presence.js';
import { ChatService } from './chat.service.js';
import { CountUnreadHandler } from './cqrs/handler/count-unread.handler.js';
import { CreateMessageHandler } from './cqrs/handler/create-message.handler.js';
import { FindConversationHandler } from './cqrs/handler/find-conversation.handler.js';
import { FindMessageHandler } from './cqrs/handler/find-message.handler.js';
import { ListConversationsHandler } from './cqrs/handler/list-conversations.handler.js';
import { ListMessagesHandler } from './cqrs/handler/list-messages.handler.js';
import { MarkReadHandler } from './cqrs/handler/mark-read.handler.js';
import { OpenConversationHandler } from './cqrs/handler/open-conversation.handler.js';
import { ChatListener } from './event/chat.listener.js';
import { CHAT_QUEUE, ChatProcessor } from './queue/chat.queue.js';

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
