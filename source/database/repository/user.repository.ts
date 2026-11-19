import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { IUser } from '../../dependencies/interface/index.js';
import { User } from '../model/index.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class UserRepository extends DatabaseRepository<IUser> {
  constructor(@InjectModel(User.name) private readonly userModel: Model<IUser>) {
    super(userModel);
  }
}
