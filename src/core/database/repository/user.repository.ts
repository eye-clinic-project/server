import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../model/user.model.js';
import { DatabaseRepository } from './base.repository.js';


@Injectable()
export class UserRepository extends DatabaseRepository<UserDocument> {
  constructor(@InjectModel(User.name) model: Model<UserDocument>) {
    super(model);
  }

  findByEmailWithPassword(email: string) {
    return this.findOne({
      filter: { email: email.toLowerCase() },
      projection: '+passwordHash',
    });
  }
}
