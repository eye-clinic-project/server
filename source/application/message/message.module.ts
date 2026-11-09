import { Module } from '@nestjs/common';
import { MessageService } from './message.service.js';
import { MessageGateway } from './message.gateway.js';
import { MessageController } from './message.controller.js';

@Module({
  providers: [MessageGateway, MessageService],
  controllers: [MessageController],
})
export class MessageModule {}
