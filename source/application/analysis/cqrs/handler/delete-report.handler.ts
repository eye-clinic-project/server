import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { ReportView } from '../../entity/index.js';
import { DeleteReportCommand } from '../command/index.js';
import { ReportRepository } from '../../../../database/repository/index.js';
import { ReportStatus } from '../../../../dependencies/enum/index.js';

@CommandHandler(DeleteReportCommand)
export class DeleteReportHandler implements ICommandHandler<DeleteReportCommand> {
  constructor(private readonly reportRepository: ReportRepository) {}

  execute({ reportId }: DeleteReportCommand): Promise<ReportView | null> {
    return this.reportRepository.findOneAndDelete({ filter: { _id: reportId, status: ReportStatus.DRAFT } }) as Promise<ReportView | null>;
  }
}
