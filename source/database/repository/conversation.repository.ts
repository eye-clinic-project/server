import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseRepository } from './base.repository.js';
import { Conversation } from '../model/conversation.model.js';
import { IConversation } from '../../dependency/interface/database-schema.interface.js';

@Injectable()
export class ConversationRepository extends DatabaseRepository<IConversation> {
  constructor(
    @InjectModel(Conversation.name)
    readonly typedModel: Model<IConversation>,
  ) {
    super(typedModel);
  }
}
