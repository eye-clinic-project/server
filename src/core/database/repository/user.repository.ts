import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';


import { DatabaseRepository } from './base.repository.js';
import { User, type HUserDocument } from '../model/user.model.js';
import { UserRoleEnum } from '../../../common/enum/security.enum.js';
import { IUser } from '../../../common/interface/database-schema.interface.js';

@Injectable()
export class UserRepository extends DatabaseRepository<IUser> {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<IUser>,
  ) {
    super(userModel);
  }

  findHydratedById(id: Types.ObjectId): Promise<HUserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string) {
    return this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash')
      .exec();
  }

  async findByRole(role: UserRoleEnum) {
    return this.userModel.find({ role }).exec();
  }

  async findByEmailWithoutPassword(email: string) {
    return this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .exec();
  }

  async searchByName(name: string, limit = 10) {
    return this.userModel
      .find({ name: { $regex: name, $options: 'i' } })
      .limit(limit)
      .exec();
  }

  async emailExists(email: string) {
    return this.userModel.exists({
      email: email.toLowerCase().trim(),
    });
  }
}