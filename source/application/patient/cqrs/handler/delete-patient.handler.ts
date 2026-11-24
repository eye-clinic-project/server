import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { DeletePatientCommand } from '../command/delete-patient.command.js';
import { DoctorPatientRepository } from '../../../../database/repository/doctor-patient.repository.js';
import { PatientRepository } from '../../../../database/repository/patient.repository.js';
import { UserRepository } from '../../../../database/repository/user.repository.js';
import { SystemRoleEnum } from '../../../../dependencies/enum/security.enum.js';

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
