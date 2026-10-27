import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, HUserDocument } from '../model/user.model.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class UserRepository extends DatabaseRepository<HUserDocument> {
  constructor(@InjectModel(User.name) model: Model<HUserDocument>) {
    super(model);
  }

  findByEmailWithPassword(email: string) {
    return this.findOne({
      filter: { email: email.toLowerCase() },
      projection: '+passwordHash',
    });
  }
}
