import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service.js';
import { ConversationController } from './conversation.controller.js';
import { ConversationGateway } from './conversation.gateway.js';

@Module({
  controllers: [ConversationController],
  providers: [ConversationService, ConversationGateway],
})
export class ConversationModule {}
