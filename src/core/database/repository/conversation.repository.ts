import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Conversation,
  ConversationDocument,
} from '../model/conversation.model.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class ConversationRepository extends DatabaseRepository<ConversationDocument> {
  constructor(
    @InjectModel(Conversation.name) model: Model<ConversationDocument>,
  ) {
    super(model);
  }

  findOrCreate(
    doctorId: Types.ObjectId | string,
    patientId: Types.ObjectId | string,
  ) {
    return this.findOneAndUpdate({
      filter: { doctor: doctorId, patient: patientId },
      update: { $setOnInsert: { doctor: doctorId, patient: patientId } },
      options: { upsert: true },
    });
  }
}
