import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

import { NotificationType } from '../../../dependencies/enum/index.js';
import { NotificationService } from '../../../dependencies/service/index.js';

export const ADMIN_QUEUE = 'admin';

export enum AdminJob {
  NOTIFY_DOCTOR_DECISION = 'notify-doctor-decision',
}

export type DoctorDecisionTemplate = 'doctorApproved' | 'doctorRejected';

export interface NotifyDoctorDecisionJob {
  doctorProfileId: string;
  doctorUserId: string;
  template: DoctorDecisionTemplate;
  reason: string | null;
}

@Processor(ADMIN_QUEUE)
export class AdminProcessor extends WorkerHost {
  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  async process(job: Job<NotifyDoctorDecisionJob>): Promise<void> {
    switch (job.name) {
      case AdminJob.NOTIFY_DOCTOR_DECISION:
        await this.notifyDoctorDecision(job.data);
        break;
    }
  }

  private notifyDoctorDecision({ doctorProfileId, doctorUserId, template, reason }: NotifyDoctorDecisionJob): Promise<void> {
    return this.notificationService.notify({
      recipient: doctorUserId,
      type: NotificationType.SYSTEM,
      template,
      args: reason ? { reason } : {},
      link: '/doctor/me/verification',
      resourceId: doctorProfileId,
    });
  }
}
