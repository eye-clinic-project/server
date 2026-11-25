import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { ReportView } from '../../type/analysis.type.js';
import { DeleteReportCommand } from '../command/delete-report.command.js';
import { ReportRepository } from '../../../../database/repository/report.repository.js';
import { ReportStatus } from '../../../../dependencies/enum/database.enum.js';

@CommandHandler(DeleteReportCommand)
export class DeleteReportHandler implements ICommandHandler<DeleteReportCommand> {
  constructor(private readonly reportRepository: ReportRepository) {}

  execute({ reportId }: DeleteReportCommand): Promise<ReportView | null> {
    return this.reportRepository.findOneAndDelete({ filter: { _id: reportId, status: ReportStatus.DRAFT } }) as Promise<ReportView | null>;
  }
}
