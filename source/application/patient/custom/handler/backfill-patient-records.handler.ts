import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import { BackfillPatientRecordsCommand } from '../command/backfill-patient-records.command.js';
import { EnsurePatientRecordCommand } from '../command/ensure-patient-record.command.js';
import { EnsurePatientRecordHandler } from './ensure-patient-record.handler.js';
import { PatientRepository } from '../../../../database/repository/patient.repository.js';
import { UserRepository } from '../../../../database/repository/user.repository.js';
import { SystemRoleEnum } from '../../../../dependencies/enum/security.enum.js';

@CommandHandler(BackfillPatientRecordsCommand)
export class BackfillPatientRecordsHandler implements ICommandHandler<BackfillPatientRecordsCommand> {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly userRepository: UserRepository,
    private readonly ensureHandler: EnsurePatientRecordHandler,
  ) {}

  async execute(): Promise<number> {
    const records: { user: Types.ObjectId }[] = await this.patientRepository.find({ filter: {}, projection: { user: 1 }, options: { lean: true } });
    const missing: { _id: Types.ObjectId }[] = await this.userRepository.find({
      filter: { role: SystemRoleEnum.PATIENT, _id: { $nin: records.map((record) => record.user) } },
      projection: { _id: 1 },
      options: { lean: true },
    });
    for (const user of missing) await this.ensureHandler.execute(new EnsurePatientRecordCommand(user._id));
    return missing.length;
  }
}
