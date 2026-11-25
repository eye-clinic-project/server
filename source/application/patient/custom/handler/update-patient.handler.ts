import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';

import { PatientRepository } from '../../../../database/repository/patient.repository.js';
import { UserRepository } from '../../../../database/repository/user.repository.js';
import { UpdatePatientCommand } from '../command/update-patient.command.js';

@CommandHandler(UpdatePatientCommand)
export class UpdatePatientHandler implements ICommandHandler<UpdatePatientCommand> {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute({ patientId, userId, account, profile }: UpdatePatientCommand): Promise<void> {
    if (Object.keys(account).length) {
      const user = await this.userRepository.findByIdAndUpdate({ _id: userId, update: { $set: account } });
      if (!user) throw new NotFoundException('Patient not found');
    }
    if (Object.keys(profile).length) {
      const patient = await this.patientRepository.findByIdAndUpdate({ _id: patientId, update: { $set: profile } });
      if (!patient) throw new NotFoundException('Patient not found');
    }
  }
}
