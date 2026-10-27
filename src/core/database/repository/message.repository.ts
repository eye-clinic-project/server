import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, HMessageDocument } from '../model/message.model.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class MessageRepository extends DatabaseRepository<HMessageDocument> {
  constructor(@InjectModel(Message.name) model: Model<HMessageDocument>) {
    super(model);
  }

  byConversation(conversationId: Types.ObjectId | string, page = 1, size = 30) {
    return this.paginate({
      filter: { conversation: conversationId },
      options: { sort: { sentAt: -1 } },
      page,
      size,
    });
  }
}
