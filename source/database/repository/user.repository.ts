import { escapeRegex } from '../../dependency/service/util.service.js';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { DatabaseRepository } from './base.repository.js';
import { User, type HUserDocument } from '../model/user.model.js';
import { IUser } from '../../dependency/interface/database-schema.interface.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';

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

  createAuthUser(data: Partial<IUser>): Promise<HUserDocument> {
    return new this.userModel(data).save();
  }

  async findByEmail(email: string): Promise<HUserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash +googleId').exec();
  }

  get rawModel(): Model<IUser> {
    return this.userModel;
  }

  async findByRole(role: SystemRoleEnum) {
    return this.userModel.find({ role }).exec();
  }

  updateUserProfile(userId: Types.ObjectId, profile: Partial<Pick<IUser, 'name' | 'city' | 'phone' | 'avatarUrl' | 'avatarKey' | 'lang'>>) {
    return this.userModel.findByIdAndUpdate(userId, { $set: profile }, { new: true, runValidators: true }).exec();
  }

  async findByEmailWithoutPassword(email: string): Promise<HUserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).select('+googleId').exec();
  }

  async searchByName(name: string, limit = 10) {
    return this.userModel
      .find({ name: { $regex: escapeRegex(name), $options: 'i' } })
      .limit(limit)
      .exec();
  }

  async emailExists(email: string) {
    return this.userModel.exists({
      email: email.toLowerCase().trim(),
    });
  }
}
