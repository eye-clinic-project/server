import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule, ServiceModule } from '../../dependencies/module/index.js';
import { AiService } from './ai.service.js';
import { AnalysisController } from './analysis.controller.js';
import { AnalysisService } from './analysis.service.js';
import {
  ClaimAnalysisHandler,
  CompleteAnalysisHandler,
  CreateAnalysisHandler,
  CreateReportHandler,
  CreateReviewHandler,
  DeleteAnalysisHandler,
  DeleteReportHandler,
  FailAnalysisHandler,
  FindAnalysisHandler,
  FindReportByAnalysisHandler,
  FindReportHandler,
  FindReviewHandler,
  ListAnalysesHandler,
  ListReportsHandler,
  MarkReportViewedHandler,
  RequeueAnalysesHandler,
  RetryAnalysisHandler,
  SendReportHandler,
  SetReportPdfHandler,
  UpdateReportHandler,
  UpdateReviewHandler,
} from './cqrs/handler/index.js';
import { AnalysisListener } from './event/index.js';
import { ANALYSIS_QUEUE, ANALYSIS_TASK_QUEUE, AnalysisProcessor, AnalysisTaskProcessor } from './queue/index.js';
import { ReportController } from './report.controller.js';
import { ReportService } from './report.service.js';

@Module({
  imports: [DatabaseModule, ServiceModule, BullModule.registerQueue({ name: ANALYSIS_QUEUE }, { name: ANALYSIS_TASK_QUEUE })],
  controllers: [AnalysisController, ReportController],
  providers: [
    AnalysisService,
    ReportService,
    AiService,
    AnalysisListener,
    AnalysisProcessor,
    AnalysisTaskProcessor,
    FindAnalysisHandler,
    ListAnalysesHandler,
    FindReviewHandler,
    FindReportHandler,
    FindReportByAnalysisHandler,
    ListReportsHandler,
    CreateAnalysisHandler,
    ClaimAnalysisHandler,
    CompleteAnalysisHandler,
    FailAnalysisHandler,
    RetryAnalysisHandler,
    RequeueAnalysesHandler,
    DeleteAnalysisHandler,
    CreateReviewHandler,
    UpdateReviewHandler,
    CreateReportHandler,
    UpdateReportHandler,
    SetReportPdfHandler,
    SendReportHandler,
    MarkReportViewedHandler,
    DeleteReportHandler,
  ],
})
export class AnalysisModule {}
