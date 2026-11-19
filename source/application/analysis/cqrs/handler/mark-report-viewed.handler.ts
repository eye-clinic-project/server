import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { MarkReportViewedCommand } from '../command/index.js';
import { ReportRepository } from '../../../../database/repository/index.js';

@CommandHandler(MarkReportViewedCommand)
export class MarkReportViewedHandler implements ICommandHandler<MarkReportViewedCommand> {
  constructor(private readonly reportRepository: ReportRepository) {}

  async execute({ reportId }: MarkReportViewedCommand): Promise<void> {
    await this.reportRepository.updateOne({ filter: { _id: reportId, viewedAt: null }, update: { $set: { viewedAt: new Date() } } });
  }
}
