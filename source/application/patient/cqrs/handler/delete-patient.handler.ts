import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { DeletePatientCommand } from '../command/index.js';
import { DoctorPatientRepository, PatientRepository, UserRepository } from '../../../../database/repository/index.js';
import { SystemRoleEnum } from '../../../../dependencies/enum/index.js';

@CommandHandler(DeletePatientCommand)
export class DeletePatientHandler implements ICommandHandler<DeletePatientCommand> {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly userRepository: UserRepository,
    private readonly doctorPatientRepository: DoctorPatientRepository,
  ) {}

  async execute({ patientId, userId }: DeletePatientCommand): Promise<void> {
    const deleted = await this.patientRepository.findByIdAndDelete({ _id: patientId });
    if (!deleted) throw new NotFoundException('Patient not found');
    await this.doctorPatientRepository.deleteMany({ filter: { patient: userId } });
    await this.userRepository.deleteOne({ filter: { _id: userId, role: SystemRoleEnum.PATIENT } });
  }
}
