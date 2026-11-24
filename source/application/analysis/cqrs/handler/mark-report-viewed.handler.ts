import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { MarkReportViewedCommand } from '../command/mark-report-viewed.command.js';
import { ReportRepository } from '../../../../database/repository/report.repository.js';

@CommandHandler(MarkReportViewedCommand)
export class MarkReportViewedHandler implements ICommandHandler<MarkReportViewedCommand> {
  constructor(private readonly reportRepository: ReportRepository) {}

  async execute({ reportId }: MarkReportViewedCommand): Promise<void> {
    await this.reportRepository.updateOne({ filter: { _id: reportId, viewedAt: null }, update: { $set: { viewedAt: new Date() } } });
  }
}
