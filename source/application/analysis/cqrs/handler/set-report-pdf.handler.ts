import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { ReportRepository } from '../../../../database/repository/index.js';
import { SetReportPdfCommand } from '../command/index.js';

@CommandHandler(SetReportPdfCommand)
export class SetReportPdfHandler implements ICommandHandler<SetReportPdfCommand> {
  constructor(private readonly reportRepository: ReportRepository) {}

  async execute({ reportId, pdfKey, pdfSize }: SetReportPdfCommand): Promise<void> {
    await this.reportRepository.updateOne({ filter: { _id: reportId }, update: { $set: { pdfKey, pdfSize } } });
  }
}
