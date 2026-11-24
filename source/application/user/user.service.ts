import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { InjectDisk, StorageDisk, type StoredUpload } from '@nestjs/storage';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Types } from 'mongoose';

import type { IUser } from '../../dependencies/interface/database.interface.js';
import { LoggerService } from '../../dependencies/service/logger.service.js';
import { NotificationService } from '../../dependencies/service/notification.service.js';
import { RemoveUserAvatarCommand } from './cqrs/command/remove-user-avatar.command.js';
import { SetUserAvatarCommand } from './cqrs/command/set-user-avatar.command.js';
import { UpdateUserProfileCommand } from './cqrs/command/update-user-profile.command.js';
import { GetUserByIdQuery } from './cqrs/query/get-user-by-id.query.js';
import { DeviceTokenDto } from './dto/device-token.dto.js';
import { RegisterDeviceDto } from './dto/register-device.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { toUserEntity, UserEntity } from './entity/user.entity.js';
import { USER_AVATAR_CHANGED_EVENT, UserAvatarChangedEvent } from './event/user-avatar-changed.event.js';
import { USER_AVATAR_REMOVED_EVENT, UserAvatarRemovedEvent } from './event/user-avatar-removed.event.js';

@Injectable()
export class UserService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly loggerService: LoggerService,
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2,
    @InjectDisk('photos') private readonly photos: StorageDisk,
  ) {}

  async getMe(user: IUser): Promise<UserEntity> {
    const found = await this.queryBus.execute(new GetUserByIdQuery(userId(user)));
    if (!found) throw new NotFoundException('User not found');
    return toUserEntity(found);
  }

  async updateMe(user: IUser, { name, city, language }: UpdateUserDto): Promise<UserEntity> {
    const profile = { ...(name !== undefined && { name }), ...(city !== undefined && { city }), ...(language !== undefined && { language }) };
    if (Object.keys(profile).length === 0) return this.getMe(user);

    const updated = await this.commandBus.execute(new UpdateUserProfileCommand(userId(user), profile));
    if (!updated) throw new NotFoundException('User not found');
    return toUserEntity(updated);
  }

  async setAvatar(user: IUser, file: StoredUpload): Promise<UserEntity> {
    const updated = await this.commandBus.execute(new SetUserAvatarCommand(userId(user), this.photos.url(file.key))).catch(async (error: unknown) => {
      await this.deleteFile(file.key);
      throw error;
    });
    if (!updated) {
      await this.deleteFile(file.key);
      throw new NotFoundException('User not found');
    }

    this.eventEmitter.emit(USER_AVATAR_CHANGED_EVENT, new UserAvatarChangedEvent(userId(user).toString(), this.storedAvatarKey(user.avatarUrl), file.key));
    return toUserEntity(updated);
  }

  async removeAvatar(user: IUser): Promise<UserEntity> {
    if (!user.avatarUrl) throw new NotFoundException('Avatar not found');
    const updated = await this.commandBus.execute(new RemoveUserAvatarCommand(userId(user)));
    if (!updated) throw new NotFoundException('User not found');
    this.eventEmitter.emit(USER_AVATAR_REMOVED_EVENT, new UserAvatarRemovedEvent(userId(user).toString(), this.storedAvatarKey(user.avatarUrl)));
    return toUserEntity(updated);
  }

  async registerDevice(user: IUser, { token }: RegisterDeviceDto): Promise<void> {
    await this.notificationService.registerDevice(userId(user).toString(), token);
  }

  async unregisterDevice(user: IUser, { token }: DeviceTokenDto): Promise<void> {
    const removed = await this.notificationService.unregisterDevice(userId(user).toString(), token);
    if (!removed) throw new NotFoundException('Device not registered');
  }

  private storedAvatarKey(avatarUrl?: string | null): string | null {
    const prefix = this.photos.url('avatars/_').slice(0, -1);
    return avatarUrl?.startsWith(prefix) ? `avatars/${avatarUrl.slice(prefix.length)}` : null;
  }

  private async deleteFile(key: string): Promise<void> {
    await this.photos.delete(key).catch((error: unknown) => this.loggerService.warn(error));
  }
}

const userId = (user: IUser): Types.ObjectId => new Types.ObjectId(user._id);
