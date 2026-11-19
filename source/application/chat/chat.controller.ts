import { Body, Controller, Get, HttpStatus, Param, ParseIntPipe, Post, Query, Req, Res } from '@nestjs/common';
import { serveFile } from '@nestjs/storage';
import type { Request, Response } from 'express';
import type { Types } from 'mongoose';

import type { IUser } from '../../dependencies/interface/index.js';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { ChatService } from './chat.service.js';
import { ListMessagesDto, StartConversationDto } from './dto/index.js';
import type { ConversationEntity, MessagePage } from './entity/index.js';
import { Auth, User } from '../../dependencies/decorator/index.js';
import { SystemRoleEnum } from '../../dependencies/enum/index.js';

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
