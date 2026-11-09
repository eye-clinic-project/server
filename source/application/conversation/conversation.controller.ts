import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({
    summary: "Open a conversation",
    description: "Doctor or patient. participantId is the other person. Only a doctor and their actively assigned patient can chat (FR6.1); otherwise 403. Returns the existing conversation if there is one.",
  })
  create(@User() user: HUserDocument, @Body() dto: CreateConversationDto) {
    return this.service.create(user, new Types.ObjectId(dto.participantId));
  }

  @Get()
  @ApiOperation({
    summary: "List my conversations",
    description: "Any signed-in user. Each item has the other participant, the last message, the unread count and whether sending is still allowed.",
  })
  list(@User() user: HUserDocument) {
    return this.service.list(user);
  }

  @Get(':conversationId')
  @ApiOperation({
    summary: "Get a conversation",
    description: "Participants or an admin.",
  })
  findOne(@User() user: HUserDocument, @Param('conversationId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.findOne(user, id);
  }

  @Get(':conversationId/messages')
  @ApiOperation({
    summary: "Get messages",
    description: "Participants or an admin. Oldest to newest. Use `before` (the nextBefore value) and `limit` to load older messages. Messages are kept, so history is visible after re-login (FR6.1).",
  })
  messages(@User() user: HUserDocument, @Param('conversationId', ParseObjectIdPipe) id: Types.ObjectId, @Query() query: MessagesQueryDto) {
    return this.service.listMessages(user, id, query);
  }

  @Post(':conversationId/messages')
  @ApiOperation({
    summary: "Send a message",
    description: "Participants only, while the doctor–patient assignment is active. Saves the message and pushes it in real time (receive_message) to everyone in the conversation and a notification to the other person. Socket.IO send_message does the same.",
  })
  send(@User() user: HUserDocument, @Param('conversationId', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: SendMessageDto) {
    return this.service.send(user, id, dto.message);
  }

  @Patch(':conversationId/read')
  @ApiOperation({
    summary: "Mark messages as read",
    description: "Participants or an admin. Marks all messages as read by me and emits message_read.",
  })
  read(@User() user: HUserDocument, @Param('conversationId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.markRead(user, id);
  }

  @Delete(':conversationId')
  @ApiOperation({
    summary: "Delete a conversation",
    description: "Participants or an admin. Deletes the conversation and all its messages.",
  })
  remove(@User() user: HUserDocument, @Param('conversationId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.remove(user, id);
  }
}
