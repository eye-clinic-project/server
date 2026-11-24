import { Processor, WorkerHost } from '@nestjs/bullmq';
import { QueryBus } from '@nestjs/cqrs';
import { InjectDisk, StorageDisk } from '@nestjs/storage';
import type { Job } from 'bullmq';

import { NotificationType } from '../../../dependencies/enum/database.enum.js';
import { NotificationService } from '../../../dependencies/service/notification.service.js';
import { FindAdminIdsQuery } from '../cqrs/query/find-admin-ids.query.js';

export const DOCTOR_QUEUE = 'doctor';

export enum DoctorJob {
  DELETE_LICENSE_FILES = 'delete-license-files',
  NOTIFY_ADMINS_LICENSE_SUBMITTED = 'notify-admins-license-submitted',
  NOTIFY_PATIENT = 'notify-patient',
}

export interface DeleteLicenseFilesJob {
  keys: string[];
}

export interface NotifyAdminsLicenseSubmittedJob {
  doctorId: string;
  doctorName: string;
}

export type DoctorPatientTemplate = 'patientAssigned' | 'assignmentEnded';

export interface NotifyPatientJob {
  patientUserId: string;
  doctorId: string;
  doctorName: string;
  template: DoctorPatientTemplate;
}

export type DoctorJobData = DeleteLicenseFilesJob | NotifyAdminsLicenseSubmittedJob | NotifyPatientJob;

@Processor(DOCTOR_QUEUE)
export class DoctorProcessor extends WorkerHost {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly notificationService: NotificationService,
    @InjectDisk('private') private readonly disk: StorageDisk,
  ) {
    super();
  }

  async process(job: Job<DoctorJobData>): Promise<void> {
    switch (job.name) {
      case DoctorJob.DELETE_LICENSE_FILES:
        await this.disk.delete((job.data as DeleteLicenseFilesJob).keys);
        break;
      case DoctorJob.NOTIFY_ADMINS_LICENSE_SUBMITTED:
        await this.notifyAdmins(job.data as NotifyAdminsLicenseSubmittedJob);
        break;
      case DoctorJob.NOTIFY_PATIENT:
        await this.notifyPatient(job.data as NotifyPatientJob);
        break;
    }
  }

  private async notifyAdmins({ doctorId, doctorName }: NotifyAdminsLicenseSubmittedJob): Promise<void> {
    const admins = await this.queryBus.execute(new FindAdminIdsQuery());
    await Promise.all(
      admins.map((admin) =>
        this.notificationService.notify({
          recipient: admin,
          type: NotificationType.SYSTEM,
          template: 'doctorVerificationSubmitted',
          args: { doctor: doctorName },
          link: `/admin/doctors/${doctorId}`,
          resourceId: doctorId,
        }),
      ),
    );
  }

  private notifyPatient({ patientUserId, doctorId, doctorName, template }: NotifyPatientJob): Promise<void> {
    return this.notificationService.notify({
      recipient: patientUserId,
      type: NotificationType.SYSTEM,
      template,
      args: { doctor: doctorName },
      link: '/patient/me/doctors',
      resourceId: doctorId,
    });
  }
}
