import { Module } from '@nestjs/common';
import { MessageService } from './message.service.js';
import { MessageController } from './message.controller.js';
import { ChatModule } from '../chat/chat.module.js';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/role.guard.js';

@Module({
  imports: [ChatModule],
  controllers: [MessageController],
  providers: [MessageService, AuthGuard, RolesGuard],
})
export class MessageModule {}
