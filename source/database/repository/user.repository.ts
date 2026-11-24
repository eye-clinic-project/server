import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { IUser } from '../../dependencies/interface/database.interface.js';
import { User } from '../model/user.model.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class UserRepository extends DatabaseRepository<IUser> {
  constructor(@InjectModel(User.name) private readonly userModel: Model<IUser>) {
    super(userModel);
  }
}
