import { ConfigService } from '@nestjs/config';
import type { BullRootModuleOptions } from '@nestjs/bullmq';

export function createQueueOptions(config: ConfigService): BullRootModuleOptions {
  return {
    connection: { url: config.getOrThrow<string>('app.redis.url') },
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: true,
      removeOnFail: 100,
    },
  };
}
