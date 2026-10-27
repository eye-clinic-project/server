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

  createAuthUser(data: Partial<IUser>): Promise<HUserDocument> {
    return new this.userModel(data).save();
  }

  async findByEmail(email: string): Promise<HUserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash')
      .exec();
  }

  async findByRole(role: UserRoleEnum) {
    return this.userModel.find({ role }).exec();
  }

  updateUserProfile(
    userId: Types.ObjectId,
    profile: { name?: string; city?: string; avatarUrl?: string },
  ) {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: profile },
        { new: true, runValidators: true },
      )
      .exec();
  }

  async findByEmailWithoutPassword(
    email: string,
  ): Promise<HUserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+googleId')
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