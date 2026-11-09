import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service.js';
import { ConversationGateway } from './conversation.gateway.js';
import { ConversationController } from './conversation.controller.js';

@Module({
  providers: [ConversationGateway, ConversationService],
  controllers: [ConversationController],
})
export class ConversationModule {}
