import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule } from '../../dependencies/module/database.module.js';
import { ServiceModule } from '../../dependencies/module/service.module.js';
import { AiService } from './ai.service.js';
import { AnalysisController } from './analysis.controller.js';
import { AnalysisService } from './analysis.service.js';
import { ClaimAnalysisHandler } from './cqrs/handler/claim-analysis.handler.js';
import { CompleteAnalysisHandler } from './cqrs/handler/complete-analysis.handler.js';
import { CreateAnalysisHandler } from './cqrs/handler/create-analysis.handler.js';
import { CreateReportHandler } from './cqrs/handler/create-report.handler.js';
import { CreateReviewHandler } from './cqrs/handler/create-review.handler.js';
import { DeleteAnalysisHandler } from './cqrs/handler/delete-analysis.handler.js';
import { DeleteReportHandler } from './cqrs/handler/delete-report.handler.js';
import { FailAnalysisHandler } from './cqrs/handler/fail-analysis.handler.js';
import { FindAnalysisHandler } from './cqrs/handler/find-analysis.handler.js';
import { FindReportByAnalysisHandler } from './cqrs/handler/find-report-by-analysis.handler.js';
import { FindReportHandler } from './cqrs/handler/find-report.handler.js';
import { FindReviewHandler } from './cqrs/handler/find-review.handler.js';
import { ListAnalysesHandler } from './cqrs/handler/list-analyses.handler.js';
import { ListReportsHandler } from './cqrs/handler/list-reports.handler.js';
import { MarkReportViewedHandler } from './cqrs/handler/mark-report-viewed.handler.js';
import { RequeueAnalysesHandler } from './cqrs/handler/requeue-analyses.handler.js';
import { RetryAnalysisHandler } from './cqrs/handler/retry-analysis.handler.js';
import { SendReportHandler } from './cqrs/handler/send-report.handler.js';
import { SetReportPdfHandler } from './cqrs/handler/set-report-pdf.handler.js';
import { UpdateReportHandler } from './cqrs/handler/update-report.handler.js';
import { UpdateReviewHandler } from './cqrs/handler/update-review.handler.js';
import { AnalysisListener } from './event/analysis.listener.js';
import { ANALYSIS_QUEUE, ANALYSIS_TASK_QUEUE, AnalysisProcessor, AnalysisTaskProcessor } from './queue/analysis.queue.js';
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
