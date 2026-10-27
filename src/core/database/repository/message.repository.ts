import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { DatabaseRepository } from './base.repository.js';
import { IMessage } from '../../../common/interface/database-schema.interface.js';
import { Message } from '../model/message.model.js';

@Injectable()
export class MessageRepository extends DatabaseRepository<IMessage> {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
  ) {
    super(messageModel);
  }

  async findByConversation(
    conversationId: Types.ObjectId,
    limit = 30,
    skip = 0,
  ) {
    return this.messageModel
      .find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender')
      .exec();
  }

  async findLatestByConversation(conversationId: Types.ObjectId) {
    return this.messageModel
      .findOne({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .populate('sender')
      .exec();
  }

  async findByIdForConversation(
    messageId: Types.ObjectId,
    conversationId: Types.ObjectId,
  ) {
    return this.messageModel
      .findOne({ _id: messageId, conversation: conversationId })
      .exec();
  }

  async findByIdForSender(messageId: Types.ObjectId, senderId: Types.ObjectId) {
    return this.messageModel
      .findOne({ _id: messageId, sender: senderId })
      .exec();
  }

  async markAsDelivered(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId,
  ) {
    return this.messageModel
      .updateMany(
        {
          conversation: conversationId,
          sender: { $ne: userId },
          deliveredTo: { $ne: userId },
          deletedAt: null,
        },
        { $addToSet: { deliveredTo: userId } },
      )
      .exec();
  }

  async markAsRead(conversationId: Types.ObjectId, userId: Types.ObjectId) {
    return this.messageModel
      .updateMany(
        {
          conversation: conversationId,
          sender: { $ne: userId },
          readBy: { $ne: userId },
          deletedAt: null,
        },
        {
          $addToSet: { readBy: userId, deliveredTo: userId },
        },
      )
      .exec();
  }

  async editMessage(
    messageId: Types.ObjectId,
    senderId: Types.ObjectId,
    message: string,
  ) {
    return this.messageModel
      .findOneAndUpdate(
        {
          _id: messageId,
          sender: senderId,
          deletedAt: null,
        },
        {
          $set: {
            message,
            editedAt: new Date(),
          },
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .exec();
  }

  async softDeleteMessage(messageId: Types.ObjectId, senderId: Types.ObjectId) {
    return this.messageModel
      .findOneAndUpdate(
        {
          _id: messageId,
          sender: senderId,
          deletedAt: null,
        },
        {
          $set: {
            deletedAt: new Date(),
            message: '',
            attachments: [],
          },
        },
        { new: true },
      )
      .exec();
  }

  async countByConversation(conversationId: Types.ObjectId) {
    return this.messageModel.countDocuments({
      conversation: conversationId,
      deletedAt: null,
    });
  }
}
