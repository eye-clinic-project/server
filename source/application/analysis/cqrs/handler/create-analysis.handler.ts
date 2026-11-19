import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { Types } from 'mongoose';

import { AnalysisRepository, FundusImageRepository } from '../../../../database/repository/index.js';
import { AnalysisStatus } from '../../../../dependencies/enum/index.js';
import { CreateAnalysisCommand } from '../command/index.js';

const defined = <T extends object>(data: T) => Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as Partial<T>;

@CommandHandler(CreateAnalysisCommand)
export class CreateAnalysisHandler implements ICommandHandler<CreateAnalysisCommand> {
  constructor(
    private readonly analysisRepository: AnalysisRepository,
    private readonly fundusImageRepository: FundusImageRepository,
  ) {}

  async execute({ doctorId, patientUserId, image }: CreateAnalysisCommand): Promise<Types.ObjectId> {
    const fundus = await this.fundusImageRepository.create({ data: { ...defined(image), patient: patientUserId, uploadedBy: doctorId } });
    try {
      const analysis = await this.analysisRepository.create({
        data: {
          doctor: doctorId,
          patient: patientUserId,
          image: fundus._id,
          status: AnalysisStatus.PENDING,
          attempts: 0,
          history: [{ status: AnalysisStatus.PENDING, message: 'Analysis created', at: new Date(), by: doctorId }],
        },
      });
      return analysis._id;
    } catch (error) {
      await this.fundusImageRepository.deleteOne({ filter: { _id: fundus._id } });
      throw error;
    }
  }
}
