import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

import { NotificationType } from '../../../dependencies/enum/database.enum.js';
import { NotificationService, type NotificationArg, type NotificationText } from '../../../dependencies/service/notification.service.js';

export const APPOINTMENT_QUEUE = 'appointment';

export enum AppointmentJob {
  NOTIFY = 'notify',
}

export type QueuedNotificationArg = string | number | { date: string } | NotificationText;

export interface NotifyAppointmentJob {
  appointmentId: string;
  recipientId: string;
  template: string;
  args: Record<string, QueuedNotificationArg>;
}

const isQueuedDate = (value: QueuedNotificationArg): value is { date: string } => typeof value === 'object' && 'date' in value;

export const toQueuedArgs = (args: Record<string, NotificationArg>): Record<string, QueuedNotificationArg> =>
  Object.fromEntries(Object.entries(args).map(([name, value]) => [name, value instanceof Date ? { date: value.toISOString() } : value]));

const fromQueuedArgs = (args: Record<string, QueuedNotificationArg>): Record<string, NotificationArg> =>
  Object.fromEntries(Object.entries(args).map(([name, value]) => [name, isQueuedDate(value) ? new Date(value.date) : value]));

@Processor(APPOINTMENT_QUEUE)
export class AppointmentProcessor extends WorkerHost {
  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  async process(job: Job<NotifyAppointmentJob>): Promise<void> {
    switch (job.name) {
      case AppointmentJob.NOTIFY:
        await this.notify(job.data);
        break;
    }
  }

  private notify({ appointmentId, recipientId, template, args }: NotifyAppointmentJob): Promise<void> {
    return this.notificationService.notify({
      recipient: recipientId,
      type: NotificationType.APPOINTMENT,
      template,
      args: fromQueuedArgs(args),
      link: `/appointments/${appointmentId}`,
      resourceId: appointmentId,
    });
  }
}
