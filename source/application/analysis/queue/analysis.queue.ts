import { Logger } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { CommandBus } from '@nestjs/cqrs';
import { InjectDisk, StorageDisk, StorageFileNotFoundError } from '@nestjs/storage';
import type { Job, Queue } from 'bullmq';
import { Types } from 'mongoose';

import { NotificationType } from '../../../dependencies/enum/index.js';
import { Localize } from '../../../dependencies/language/index.js';
import { NotificationService } from '../../../dependencies/service/index.js';
import { AiError, AiService, sha256 } from '../ai.service.js';
import { ClaimAnalysisCommand, CompleteAnalysisCommand, FailAnalysisCommand } from '../cqrs/command/index.js';
import type { AnalysisView } from '../entity/index.js';

export const ANALYSIS_QUEUE = 'analysis';
export const ANALYSIS_TASK_QUEUE = 'analysis-task';

const GENERIC_FAILURE = 'The AI analysis failed. Please retry.';

export enum AnalysisJob {
  RUN_ANALYSIS = 'run-analysis',
}

export enum AnalysisTaskJob {
  NOTIFY_DOCTOR = 'notify-doctor',
  NOTIFY_REPORT_READY = 'notify-report-ready',
  DELETE_FILES = 'delete-files',
}

export interface RunAnalysisJob {
  analysisId: string;
}

export type AnalysisDoctorTemplate = 'analysisCompleted' | 'analysisFailed';

export interface NotifyDoctorJob {
  analysisId: string;
  doctorId: string;
  patientName: string;
  template: AnalysisDoctorTemplate;
  reason?: string;
}

export interface NotifyReportReadyJob {
  reportId: string;
  patientId: string;
  doctorName: string;
}

export interface DeleteFilesJob {
  keys: string[];
}

export type AnalysisTaskJobData = NotifyDoctorJob | NotifyReportReadyJob | DeleteFilesJob;

@Processor(ANALYSIS_QUEUE, { concurrency: 1 })
export class AnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalysisProcessor.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly aiService: AiService,
    @InjectDisk('private') private readonly disk: StorageDisk,
    @InjectQueue(ANALYSIS_TASK_QUEUE) private readonly taskQueue: Queue<AnalysisTaskJobData>,
  ) {
    super();
  }

  async process(job: Job<RunAnalysisJob>): Promise<void> {
    switch (job.name) {
      case AnalysisJob.RUN_ANALYSIS:
        await this.run(new Types.ObjectId(job.data.analysisId));
        break;
    }
  }

  private async run(analysisId: Types.ObjectId): Promise<void> {
    const analysis = await this.commandBus.execute(new ClaimAnalysisCommand(analysisId));
    if (!analysis) return;

    try {
      const image = await this.loadImage(analysis);
      const prediction = await this.aiService.predict(image, analysis.image!.mimeType, analysis.image!.sha256);
      const gradCamKey = prediction.gradCamPng ? `analyses/${analysisId.toString()}/grad-cam.png` : null;
      if (gradCamKey && prediction.gradCamPng) await this.disk.put(gradCamKey, prediction.gradCamPng, { contentType: 'image/png' });

      await this.commandBus.execute(new CompleteAnalysisCommand(analysisId, prediction, gradCamKey));
      await this.notifyDoctor(analysis, 'analysisCompleted');
    } catch (error) {
      const message = error instanceof AiError ? error.message : GENERIC_FAILURE;
      if (!(error instanceof AiError)) this.logger.error(`Analysis ${analysisId.toString()} failed: ${(error as Error).message}`);
      await this.commandBus.execute(new FailAnalysisCommand(analysisId, message));
      await this.notifyDoctor(analysis, 'analysisFailed', message);
    }
  }

  private async loadImage(analysis: AnalysisView): Promise<Buffer> {
    if (!analysis.image?.storageKey) throw new AiError('The fundus image no longer exists', false);
    const data = await this.disk.getBuffer(analysis.image.storageKey).catch((error: unknown) => {
      if (error instanceof StorageFileNotFoundError) throw new AiError('The fundus image no longer exists', false);
      throw error;
    });
    if (sha256(data) !== analysis.image.sha256) throw new AiError('Stored image failed its integrity check', false);
    return data;
  }

  private async notifyDoctor(analysis: AnalysisView, template: AnalysisDoctorTemplate, reason?: string): Promise<void> {
    const data: NotifyDoctorJob = {
      analysisId: analysis._id.toString(),
      doctorId: analysis.doctor.toString(),
      patientName: analysis.patient?.name ?? '',
      template,
      ...(reason && { reason }),
    };
    await this.taskQueue
      .add(AnalysisTaskJob.NOTIFY_DOCTOR, data)
      .catch((error: Error) => this.logger.warn(`Could not queue analysis notification: ${error.message}`));
  }
}

@Processor(ANALYSIS_TASK_QUEUE)
export class AnalysisTaskProcessor extends WorkerHost {
  constructor(
    private readonly notificationService: NotificationService,
    @InjectDisk('private') private readonly disk: StorageDisk,
  ) {
    super();
  }

  async process(job: Job<AnalysisTaskJobData>): Promise<void> {
    switch (job.name) {
      case AnalysisTaskJob.NOTIFY_DOCTOR:
        await this.notifyDoctor(job.data as NotifyDoctorJob);
        break;
      case AnalysisTaskJob.NOTIFY_REPORT_READY:
        await this.notifyReportReady(job.data as NotifyReportReadyJob);
        break;
      case AnalysisTaskJob.DELETE_FILES:
        await this.disk.delete((job.data as DeleteFilesJob).keys);
        break;
    }
  }

  private notifyDoctor({ analysisId, doctorId, patientName, template, reason }: NotifyDoctorJob): Promise<void> {
    const reasonKey = reason ? Localize.key(reason) : undefined;
    return this.notificationService.notify({
      recipient: doctorId,
      type: NotificationType.ANALYSIS,
      template,
      args: { patient: patientName, ...(reason && { reason: reasonKey ? { key: reasonKey } : reason }) },
      link: `/analysis/${analysisId}`,
      resourceId: analysisId,
    });
  }

  private notifyReportReady({ reportId, patientId, doctorName }: NotifyReportReadyJob): Promise<void> {
    return this.notificationService.notify({
      recipient: patientId,
      type: NotificationType.REPORT,
      template: 'reportReady',
      args: { doctor: doctorName },
      link: `/report/${reportId}`,
      resourceId: reportId,
    });
  }
}
