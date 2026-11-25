import { Body, Controller, Get, HttpStatus, Param, ParseIntPipe, Post, Query, Req, Res } from '@nestjs/common';
import { serveFile } from '@nestjs/storage';
import type { Request, Response } from 'express';
import type { Types } from 'mongoose';

import type { IUser } from '../../dependencies/interface/database.interface.js';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { ChatService } from './chat.service.js';
import { ListMessagesDto } from './dto/list-messages.dto.js';
import { StartConversationDto } from './dto/start-conversation.dto.js';
import type { ConversationEntity } from './entity/conversation.entity.js';
import type { MessagePage } from './type/chat.type.js';
import { Auth } from '../../dependencies/decorator/auth.decorator.js';
import { User } from '../../dependencies/decorator/user.decorator.js';
import { SystemRoleEnum } from '../../dependencies/enum/security.enum.js';

const { DOCTOR, PATIENT } = SystemRoleEnum;

@Controller('chat')
@Auth({ roles: [DOCTOR, PATIENT] })
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  listConversations(@User() user: IUser): Promise<ConversationEntity[]> {
    return this.chatService.listConversations(user);
  }

  @Post('conversations')
  async startConversation(
    @User() user: IUser,
    @Body() { participantId }: StartConversationDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ConversationEntity> {
    const { created, conversation } = await this.chatService.startConversation(user, participantId);
    res.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return conversation;
  }

  @Get('conversations/:id/messages')
  listMessages(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Query() query: ListMessagesDto): Promise<MessagePage> {
    return this.chatService.listMessages(user, id, query);
  }

  @Get('attachments/:messageId/:index')
  async attachment(
    @User() user: IUser,
    @Param('messageId', ParseObjectIdPipe) messageId: Types.ObjectId,
    @Param('index', ParseIntPipe) index: number,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { key } = await this.chatService.getAttachment(user, messageId, index);
    return serveFile(this.chatService.attachmentDisk, key, { req, res, disposition: 'inline', cacheControl: 'private, max-age=3600' });
  }
}
