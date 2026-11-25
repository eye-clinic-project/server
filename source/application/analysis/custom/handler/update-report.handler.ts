import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { ReportRepository } from '../../../../database/repository/report.repository.js';
import { ReportStatus } from '../../../../dependencies/enum/database.enum.js';
import { UpdateReportCommand } from '../command/update-report.command.js';

const defined = <T extends object>(data: T) => Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as Partial<T>;

@CommandHandler(UpdateReportCommand)
export class UpdateReportHandler implements ICommandHandler<UpdateReportCommand> {
  constructor(private readonly reportRepository: ReportRepository) {}

  async execute({ reportId, data }: UpdateReportCommand): Promise<boolean> {
    const result = await this.reportRepository.updateOne({ filter: { _id: reportId, status: ReportStatus.DRAFT }, update: { $set: defined(data) } });
    return result.matchedCount > 0;
  }
}
