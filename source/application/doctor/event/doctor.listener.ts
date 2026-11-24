import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { JobsOptions, Queue } from 'bullmq';
import { OnEvent } from '@nestjs/event-emitter';

import { DOCTOR_LICENSE_SUBMITTED_EVENT, DoctorLicenseSubmittedEvent } from './doctor-license-submitted.event.js';
import { DOCTOR_PATIENT_ASSIGNED_EVENT, DoctorPatientAssignedEvent } from './doctor-patient-assigned.event.js';
import { DOCTOR_PATIENT_UNASSIGNED_EVENT, DoctorPatientUnassignedEvent } from './doctor-patient-unassigned.event.js';
import { DOCTOR_QUEUE, DoctorJob, type DoctorJobData, type DoctorPatientTemplate } from '../queue/doctor.queue.js';
import { LoggerService } from '../../../dependencies/service/logger.service.js';

@Injectable()
export class DoctorListener {
  constructor(
    private readonly loggerService: LoggerService,
    @InjectQueue(DOCTOR_QUEUE) private readonly doctorQueue: Queue<DoctorJobData>,
  ) {}

  @OnEvent(DOCTOR_LICENSE_SUBMITTED_EVENT)
  async handleLicenseSubmitted({ doctorId, doctorName, replacedKeys }: DoctorLicenseSubmittedEvent): Promise<void> {
    if (replacedKeys.length) await this.enqueue(DoctorJob.DELETE_LICENSE_FILES, { keys: replacedKeys });
    await this.enqueue(
      DoctorJob.NOTIFY_ADMINS_LICENSE_SUBMITTED,
      { doctorId, doctorName },
      { deduplication: { id: `${DoctorJob.NOTIFY_ADMINS_LICENSE_SUBMITTED}-${doctorId}` } },
    );
  }

  @OnEvent(DOCTOR_PATIENT_ASSIGNED_EVENT)
  handlePatientAssigned(event: DoctorPatientAssignedEvent): Promise<void> {
    return this.enqueuePatientNotification(event, 'patientAssigned');
  }

  @OnEvent(DOCTOR_PATIENT_UNASSIGNED_EVENT)
  handlePatientUnassigned(event: DoctorPatientUnassignedEvent): Promise<void> {
    return this.enqueuePatientNotification(event, 'assignmentEnded');
  }

  private enqueuePatientNotification({ doctorId, doctorName, patientUserId }: DoctorPatientAssignedEvent, template: DoctorPatientTemplate): Promise<void> {
    return this.enqueue(
      DoctorJob.NOTIFY_PATIENT,
      { patientUserId, doctorId, doctorName, template },
      { deduplication: { id: `${DoctorJob.NOTIFY_PATIENT}-${template}-${doctorId}-${patientUserId}` } },
    );
  }

  private async enqueue(name: DoctorJob, data: DoctorJobData, options?: JobsOptions): Promise<void> {
    try {
      await this.doctorQueue.add(name, data, options);
    } catch (error: unknown) {
      this.loggerService.warn(error);
    }
  }
}
