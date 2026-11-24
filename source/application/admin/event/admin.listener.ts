import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { OnEvent } from '@nestjs/event-emitter';

import { ADMIN_DOCTOR_DECIDED_EVENT, AdminDoctorDecidedEvent } from './admin-doctor-decided.event.js';
import { ADMIN_QUEUE, AdminJob, type NotifyDoctorDecisionJob } from '../queue/admin.queue.js';
import { DoctorVerificationStatus } from '../../../dependencies/enum/database.enum.js';
import { LoggerService } from '../../../dependencies/service/logger.service.js';

@Injectable()
export class AdminListener {
  constructor(
    private readonly loggerService: LoggerService,
    @InjectQueue(ADMIN_QUEUE) private readonly adminQueue: Queue<NotifyDoctorDecisionJob>,
  ) {}

  @OnEvent(ADMIN_DOCTOR_DECIDED_EVENT)
  async handleDoctorDecided({ doctorProfileId, doctorUserId, status, reason }: AdminDoctorDecidedEvent): Promise<void> {
    const template = status === DoctorVerificationStatus.APPROVED ? 'doctorApproved' : 'doctorRejected';
    try {
      await this.adminQueue.add(
        AdminJob.NOTIFY_DOCTOR_DECISION,
        { doctorProfileId, doctorUserId, template, reason },
        { deduplication: { id: `${AdminJob.NOTIFY_DOCTOR_DECISION}-${template}-${doctorProfileId}` } },
      );
    } catch (error: unknown) {
      this.loggerService.warn(error);
    }
  }
}
