import { Module } from '@nestjs/common';
import { ChatService } from './chat.service.js';
import { ChatGateway } from './chat.gateway.js';
import { ChatController } from './chat.controller.js';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/role.guard.js';
import { ConversationRepository } from '../../core/database/repository/conversation.repository.js';
import { DoctorPatientRepository } from '../../core/database/repository/doctor-patient.repository.js';
import { MessageRepository } from '../../core/database/repository/message.repository.js';
import { ChatResolver } from './graphql/chat.resolver.js';

@Module({
  controllers: [ChatController],
  providers: [
    ChatGateway,
    ChatService,
    ChatResolver,
    AuthGuard,
    RolesGuard,
    ConversationRepository,
    DoctorPatientRepository,
    MessageRepository,
  ],
  exports: [ChatService],
})
export class ChatModule {}
