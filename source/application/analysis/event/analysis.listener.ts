import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { OnEvent } from '@nestjs/event-emitter';

import { ANALYSIS_DELETED_EVENT, AnalysisDeletedEvent } from './analysis-deleted.event.js';
import { ANALYSIS_QUEUE, ANALYSIS_TASK_QUEUE, AnalysisJob, AnalysisTaskJob, type AnalysisTaskJobData, type RunAnalysisJob } from '../queue/analysis.queue.js';
import { RequeueAnalysesCommand } from '../cqrs/command/requeue-analyses.command.js';
import { ANALYSIS_REQUESTED_EVENT, AnalysisRequestedEvent } from './analysis-requested.event.js';
import { LoggerService } from '../../../dependencies/service/logger.service.js';
import { REPORT_DELETED_EVENT, ReportDeletedEvent } from './report-deleted.event.js';
import { REPORT_SENT_EVENT, ReportSentEvent } from './report-sent.event.js';

@Injectable()
export class AnalysisListener implements OnApplicationBootstrap {
  private readonly logger = new Logger(AnalysisListener.name);

  constructor(
    private readonly loggerService: LoggerService,
    private readonly commandBus: CommandBus,
    @InjectQueue(ANALYSIS_QUEUE) private readonly analysisQueue: Queue<RunAnalysisJob>,
    @InjectQueue(ANALYSIS_TASK_QUEUE) private readonly taskQueue: Queue<AnalysisTaskJobData>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const pending = await this.commandBus.execute(new RequeueAnalysesCommand());
    if (pending.length) this.logger.log(`Resuming ${pending.length} pending analyses`);
    await Promise.all(pending.map((analysisId) => this.enqueueAnalysis(analysisId.toString())));
  }

  @OnEvent(ANALYSIS_REQUESTED_EVENT)
  handleAnalysisRequested({ analysisId }: AnalysisRequestedEvent): Promise<void> {
    return this.enqueueAnalysis(analysisId);
  }

  @OnEvent(ANALYSIS_DELETED_EVENT)
  async handleAnalysisDeleted({ fileKeys }: AnalysisDeletedEvent): Promise<void> {
    if (fileKeys.length) await this.enqueueTask(AnalysisTaskJob.DELETE_FILES, { keys: fileKeys });
  }

  @OnEvent(REPORT_SENT_EVENT)
  handleReportSent({ reportId, patientId, doctorName }: ReportSentEvent): Promise<void> {
    return this.enqueueTask(AnalysisTaskJob.NOTIFY_REPORT_READY, { reportId, patientId, doctorName }, `${AnalysisTaskJob.NOTIFY_REPORT_READY}-${reportId}`);
  }

  @OnEvent(REPORT_DELETED_EVENT)
  async handleReportDeleted({ pdfKey }: ReportDeletedEvent): Promise<void> {
    if (pdfKey) await this.enqueueTask(AnalysisTaskJob.DELETE_FILES, { keys: [pdfKey] });
  }

  private async enqueueAnalysis(analysisId: string): Promise<void> {
    try {
      await this.analysisQueue.add(
        AnalysisJob.RUN_ANALYSIS,
        { analysisId },
        { attempts: 1, deduplication: { id: `${AnalysisJob.RUN_ANALYSIS}-${analysisId}` } },
      );
    } catch (error: unknown) {
      this.loggerService.warn(error);
    }
  }

  private async enqueueTask(name: AnalysisTaskJob, data: AnalysisTaskJobData, deduplicationId?: string): Promise<void> {
    try {
      await this.taskQueue.add(name, data, deduplicationId ? { deduplication: { id: deduplicationId } } : undefined);
    } catch (error: unknown) {
      this.loggerService.warn(error);
    }
  }
}
