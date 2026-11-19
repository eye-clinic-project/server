import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { IMessage } from '../../dependencies/interface/index.js';
import { Message } from '../model/index.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class MessageRepository extends DatabaseRepository<IMessage> {
  constructor(@InjectModel(Message.name) private readonly messageModel: Model<IMessage>) {
    super(messageModel);
  }
}
