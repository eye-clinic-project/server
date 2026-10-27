import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { DatabaseRepository } from './base.repository.js';
import { IConversation } from '../../../common/interface/database-schema.interface.js';
import { Conversation } from '../model/conversation.model.js';

@Injectable()
export class ConversationRepository extends DatabaseRepository<IConversation> {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<IConversation>,
  ) {
    super(conversationModel);
  }

  async findByParticipant(userId: Types.ObjectId) {
    return this.conversationModel
      .find({ participants: userId })
      .populate('participants')
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findBetweenUsers(
    firstUserId: Types.ObjectId,
    secondUserId: Types.ObjectId,
  ) {
    return this.conversationModel
      .findOne({
        participants: {
          $all: [firstUserId, secondUserId],
          $size: 2,
        },
      })
      .populate('participants')
      .populate('lastMessage')
      .exec();
  }

  async isParticipant(conversationId: Types.ObjectId, userId: Types.ObjectId) {
    return this.conversationModel.exists({
      _id: conversationId,
      participants: userId,
    });
  }

  async findParticipantConversation(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId,
  ) {
    return this.conversationModel
      .findOne({ _id: conversationId, participants: userId })
      .exec();
  }

  async updateLastMessage(
    conversationId: Types.ObjectId,
    messageId: Types.ObjectId,
  ) {
    return this.conversationModel
      .findByIdAndUpdate(
        conversationId,
        { $set: { lastMessage: messageId } },
        { new: true },
      )
      .exec();
  }

  async touch(conversationId: Types.ObjectId) {
    return this.conversationModel
      .findByIdAndUpdate(
        conversationId,
        { $set: { updatedAt: new Date() } },
        { new: true },
      )
      .exec();
  }
}
