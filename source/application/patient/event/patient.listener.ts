import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { OnEvent } from '@nestjs/event-emitter';

import { LoggerService } from '../../../dependencies/service/index.js';
import { PATIENT_CREATED_EVENT, PatientCreatedEvent } from './patient-created.event.js';
import { type NotifyPatientAssignedJob, PATIENT_QUEUE, PatientJob } from '../queue/index.js';

@Injectable()
export class PatientListener {
  constructor(
    private readonly loggerService: LoggerService,
    @InjectQueue(PATIENT_QUEUE) private readonly patientQueue: Queue<NotifyPatientAssignedJob>,
  ) {}

  @OnEvent(PATIENT_CREATED_EVENT)
  async handlePatientCreated(event: PatientCreatedEvent): Promise<void> {
    if (!event.assignedDoctor) return;
    try {
      await this.patientQueue.add(
        PatientJob.NOTIFY_ASSIGNED,
        { patientUserId: event.patientUserId, doctorId: event.assignedDoctor.id, doctorName: event.assignedDoctor.name },
        { deduplication: { id: `${PatientJob.NOTIFY_ASSIGNED}-${event.assignedDoctor.id}-${event.patientUserId}` } },
      );
    } catch (error: unknown) {
      this.loggerService.warn(error);
    }
  }
}
