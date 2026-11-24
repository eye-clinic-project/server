import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';

import { LoggerService } from '../../../dependencies/service/logger.service.js';
import { type DeleteAvatarFileJob, USER_QUEUE, UserJob } from '../queue/user.queue.js';
import { USER_AVATAR_CHANGED_EVENT, UserAvatarChangedEvent } from './user-avatar-changed.event.js';
import { USER_AVATAR_REMOVED_EVENT, UserAvatarRemovedEvent } from './user-avatar-removed.event.js';

@Injectable()
export class UserListener {
  constructor(
    private readonly loggerService: LoggerService,
    @InjectQueue(USER_QUEUE) private readonly userQueue: Queue<DeleteAvatarFileJob>,
  ) {}

  @OnEvent(USER_AVATAR_CHANGED_EVENT)
  handleAvatarChanged(event: UserAvatarChangedEvent): Promise<void> {
    if (!event.previousKey || event.previousKey === event.currentKey) return Promise.resolve();
    return this.enqueueAvatarDeletion(event.previousKey);
  }

  @OnEvent(USER_AVATAR_REMOVED_EVENT)
  handleAvatarRemoved(event: UserAvatarRemovedEvent): Promise<void> {
    if (!event.removedKey) return Promise.resolve();
    return this.enqueueAvatarDeletion(event.removedKey);
  }

  private async enqueueAvatarDeletion(key: string): Promise<void> {
    try {
      await this.userQueue.add(UserJob.DELETE_AVATAR_FILE, { key }, { deduplication: { id: `${UserJob.DELETE_AVATAR_FILE}-${key}` } });
    } catch (error: unknown) {
      this.loggerService.warn(error);
    }
  }
}
