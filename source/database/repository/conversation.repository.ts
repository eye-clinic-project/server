import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { IConversation } from '../../dependencies/interface/index.js';
import { Conversation } from '../model/index.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class ConversationRepository extends DatabaseRepository<IConversation> {
  constructor(@InjectModel(Conversation.name) private readonly conversationModel: Model<IConversation>) {
    super(conversationModel);
  }
}
