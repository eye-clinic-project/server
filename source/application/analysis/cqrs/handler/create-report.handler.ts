import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { Types } from 'mongoose';
import { CreateReportCommand } from '../command/index.js';
import { ReportRepository } from '../../../../database/repository/index.js';
import { ReportStatus } from '../../../../dependencies/enum/index.js';

const defined = <T extends object>(data: T) => Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as Partial<T>;

@CommandHandler(CreateReportCommand)
export class CreateReportHandler implements ICommandHandler<CreateReportCommand> {
  constructor(private readonly reportRepository: ReportRepository) {}

  async execute({ analysis, reviewId, data }: CreateReportCommand): Promise<Types.ObjectId> {
    const report = await this.reportRepository.create({
      data: { ...defined(data), doctor: analysis.doctor, patient: analysis.patient._id, analysis: analysis._id, review: reviewId, status: ReportStatus.DRAFT },
    });
    return report._id;
  }
}
