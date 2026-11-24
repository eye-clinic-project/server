import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { ReportRepository } from '../../../../database/repository/report.repository.js';
import { ReportStatus } from '../../../../dependencies/enum/database.enum.js';
import { SendReportCommand } from '../command/send-report.command.js';

@CommandHandler(SendReportCommand)
export class SendReportHandler implements ICommandHandler<SendReportCommand> {
  constructor(private readonly reportRepository: ReportRepository) {}

  async execute({ reportId }: SendReportCommand): Promise<boolean> {
    const result = await this.reportRepository.updateOne({
      filter: { _id: reportId, status: ReportStatus.DRAFT },
      update: { $set: { status: ReportStatus.SENT, sentAt: new Date() } },
    });
    return result.modifiedCount > 0;
  }
}
