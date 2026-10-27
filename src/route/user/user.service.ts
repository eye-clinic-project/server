import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { UserRepository } from '../../core/database/repository/user.repository.js';

@Injectable()
export class UserService {
  constructor(private readonly users: UserRepository) {}

  async findMyProfile(userId: Types.ObjectId) {
    const user = await this.users.findHydratedById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toPublicProfile(user);
  }

  async updateMyProfile(
    userId: Types.ObjectId,
    input: { name?: string; city?: string },
  ) {
    const name = input.name?.trim();
    const city = input.city?.trim();
    if (
      (name !== undefined && (!name || name.length > 100)) ||
      (city !== undefined && (!city || city.length > 100)) ||
      (name === undefined && city === undefined)
    ) {
      throw new BadRequestException(
        'Provide a non-empty name or city of at most 100 characters',
      );
    }

    const user = await this.users.updateUserProfile(userId, {
      ...(name !== undefined && { name }),
      ...(city !== undefined && { city }),
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toPublicProfile(user);
  }

  async updateMyAvatar(userId: Types.ObjectId, avatarUrl: string) {
    const user = await this.users.updateUserProfile(userId, { avatarUrl });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toPublicProfile(user);
  }

  private toPublicProfile(user: {
    _id: Types.ObjectId;
    name: string;
    email: string;
    city: string;
    role: string;
    avatarUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      city: user.city,
      role: user.role,
      avatarUrl: user.avatarUrl ?? null,
      createdAt: user.createdAt ?? null,
      updatedAt: user.updatedAt ?? null,
    };
  }
}
