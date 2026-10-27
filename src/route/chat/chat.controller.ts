import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from '../../common/decorator/auth.decorator.js';
import { User } from '../../common/decorator/user.decorator.js';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import type { HUserDocument } from '../../core/database/model/user.model.js';
import { CreateMessageDto } from '../message/dto/create-message.dto.js';
import { ChatService } from './chat.service.js';
import { MessageHistoryQueryDto } from './dto/message-history-query.dto.js';
import { StartConversationDto } from './dto/start-conversation.dto.js';

@Controller('chat')
@Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post('conversations')
  startConversation(
    @User() user: HUserDocument,
    @Body() dto: StartConversationDto,
  ) {
    return this.chat.startConversation(user._id.toString(), dto.participantId);
  }

  @Get('conversations')
  findConversations(@User() user: HUserDocument) {
    return this.chat.findConversations(user._id.toString());
  }

  @Get('conversations/:conversationId/messages')
  findMessages(
    @User() user: HUserDocument,
    @Param('conversationId') conversationId: string,
    @Query() query: MessageHistoryQueryDto,
  ) {
    return this.chat.findMessages(
      user._id.toString(),
      conversationId,
      query.limit,
      query.skip,
    );
  }

  @Post('conversations/:conversationId/messages')
  sendMessage(
    @User() user: HUserDocument,
    @Param('conversationId') conversationId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.chat.sendMessage(user._id.toString(), conversationId, dto);
  }

  @Patch('conversations/:conversationId/delivered')
  markDelivered(
    @User() user: HUserDocument,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chat.markDelivered(user._id.toString(), conversationId);
  }

  @Patch('conversations/:conversationId/read')
  markRead(
    @User() user: HUserDocument,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chat.markRead(user._id.toString(), conversationId);
  }
}
