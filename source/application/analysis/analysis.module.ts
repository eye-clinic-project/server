import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { DatabaseModule } from '../../dependencies/module/database.module.js';
import { ServiceModule } from '../../dependencies/module/service.module.js';
import { AiService } from './ai.service.js';
import { AnalysisController } from './analysis.controller.js';
import { AnalysisService } from './analysis.service.js';
import { ClaimAnalysisHandler } from './custom/handler/claim-analysis.handler.js';
import { CompleteAnalysisHandler } from './custom/handler/complete-analysis.handler.js';
import { CreateAnalysisHandler } from './custom/handler/create-analysis.handler.js';
import { CreateReportHandler } from './custom/handler/create-report.handler.js';
import { CreateReviewHandler } from './custom/handler/create-review.handler.js';
import { DeleteAnalysisHandler } from './custom/handler/delete-analysis.handler.js';
import { DeleteReportHandler } from './custom/handler/delete-report.handler.js';
import { FailAnalysisHandler } from './custom/handler/fail-analysis.handler.js';
import { FindAnalysisHandler } from './custom/handler/find-analysis.handler.js';
import { FindReportByAnalysisHandler } from './custom/handler/find-report-by-analysis.handler.js';
import { FindReportHandler } from './custom/handler/find-report.handler.js';
import { FindReviewHandler } from './custom/handler/find-review.handler.js';
import { ListAnalysesHandler } from './custom/handler/list-analyses.handler.js';
import { ListReportsHandler } from './custom/handler/list-reports.handler.js';
import { MarkReportViewedHandler } from './custom/handler/mark-report-viewed.handler.js';
import { RequeueAnalysesHandler } from './custom/handler/requeue-analyses.handler.js';
import { RetryAnalysisHandler } from './custom/handler/retry-analysis.handler.js';
import { SendReportHandler } from './custom/handler/send-report.handler.js';
import { SetReportPdfHandler } from './custom/handler/set-report-pdf.handler.js';
import { UpdateReportHandler } from './custom/handler/update-report.handler.js';
import { UpdateReviewHandler } from './custom/handler/update-review.handler.js';
import { AnalysisListener } from './event/analysis.listener.js';
import { ANALYSIS_QUEUE, ANALYSIS_TASK_QUEUE, AnalysisProcessor, AnalysisTaskProcessor } from './queue/analysis.queue.js';
import { ReportController } from './report.controller.js';
import { ReportService } from './report.service.js';
import { AnalysisMiddleware } from './middleware/analysis.middleware.js';

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
export class AnalysisModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AnalysisMiddleware).forRoutes(AnalysisController, ReportController);
  }
}
