import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Auth } from '../../dependency/decorator/auth.decorator.js';
import { User } from '../../dependency/decorator/user.decorator.js';
import type { HUserDocument } from '../../database/model/user.model.js';
import { ParseObjectIdPipe } from '../../dependency/pipe/object-id.pipe.js';
import { ConversationService } from './conversation.service.js';
import { CreateConversationDto, MessagesQueryDto, SendMessageDto } from './dto/conversation.dto.js';

@ApiTags('Chat')
@Controller('api/v1/conversations')
@Auth()
export class ConversationController {
  constructor(private readonly service: ConversationService) {}

  @Post()
  create(@User() user: HUserDocument, @Body() dto: CreateConversationDto) {
    return this.service.create(user, new Types.ObjectId(dto.participantId));
  }

  @Get()
  list(@User() user: HUserDocument) {
    return this.service.list(user);
  }

  @Get(':conversationId')
  findOne(@User() user: HUserDocument, @Param('conversationId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.findOne(user, id);
  }

  @Get(':conversationId/messages')
  messages(@User() user: HUserDocument, @Param('conversationId', ParseObjectIdPipe) id: Types.ObjectId, @Query() query: MessagesQueryDto) {
    return this.service.listMessages(user, id, query);
  }

  @Post(':conversationId/messages')
  send(@User() user: HUserDocument, @Param('conversationId', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: SendMessageDto) {
    return this.service.send(user, id, dto.message);
  }

  @Patch(':conversationId/read')
  read(@User() user: HUserDocument, @Param('conversationId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.markRead(user, id);
  }

  @Delete(':conversationId')
  remove(@User() user: HUserDocument, @Param('conversationId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.remove(user, id);
  }
}
