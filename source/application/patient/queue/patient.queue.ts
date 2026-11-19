import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

import { NotificationType } from '../../../dependencies/enum/index.js';
import { NotificationService } from '../../../dependencies/service/index.js';

export const PATIENT_QUEUE = 'patient';

export enum PatientJob {
  NOTIFY_ASSIGNED = 'notify-assigned',
}

export interface NotifyPatientAssignedJob {
  patientUserId: string;
  doctorId: string;
  doctorName: string;
}

@Processor(PATIENT_QUEUE)
export class PatientProcessor extends WorkerHost {
  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  async process(job: Job<NotifyPatientAssignedJob>): Promise<void> {
    switch (job.name) {
      case PatientJob.NOTIFY_ASSIGNED:
        await this.notificationService.notify({
          recipient: job.data.patientUserId,
          type: NotificationType.SYSTEM,
          template: 'patientAssigned',
          args: { doctor: job.data.doctorName },
          link: '/patient/me/doctors',
          resourceId: job.data.doctorId,
        });
        break;
    }
  }
}
