import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule } from '../../dependencies/module/database.module.js';
import { ServiceModule } from '../../dependencies/module/service.module.js';
import { ChatController } from './chat.controller.js';
import { ChatGateway } from './chat.gateway.js';
import { ChatPresence } from './chat.presence.js';
import { ChatService } from './chat.service.js';
import { CountUnreadHandler } from './custom/handler/count-unread.handler.js';
import { CreateMessageHandler } from './custom/handler/create-message.handler.js';
import { FindConversationHandler } from './custom/handler/find-conversation.handler.js';
import { FindMessageHandler } from './custom/handler/find-message.handler.js';
import { ListConversationsHandler } from './custom/handler/list-conversations.handler.js';
import { ListMessagesHandler } from './custom/handler/list-messages.handler.js';
import { MarkReadHandler } from './custom/handler/mark-read.handler.js';
import { OpenConversationHandler } from './custom/handler/open-conversation.handler.js';
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
