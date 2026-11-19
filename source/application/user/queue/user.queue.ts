import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectDisk, StorageDisk } from '@nestjs/storage';
import type { Job } from 'bullmq';

export const USER_QUEUE = 'user';

export enum UserJob {
  DELETE_AVATAR_FILE = 'delete-avatar-file',
}

export interface DeleteAvatarFileJob {
  key: string;
}

@Processor(USER_QUEUE)
export class UserProcessor extends WorkerHost {
  constructor(@InjectDisk('photos') private readonly photos: StorageDisk) {
    super();
  }

  async process(job: Job<DeleteAvatarFileJob>): Promise<void> {
    switch (job.name) {
      case UserJob.DELETE_AVATAR_FILE:
        await this.photos.delete(job.data.key);
        break;
    }
  }
}
