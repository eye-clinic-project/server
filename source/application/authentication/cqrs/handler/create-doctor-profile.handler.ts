import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { DoctorRepository } from '../../../../database/repository/doctor.repository.js';
import { UserRepository } from '../../../../database/repository/user.repository.js';
import { DoctorVerificationStatus } from '../../../../dependencies/enum/database.enum.js';
import { CreateDoctorProfileCommand } from '../command/create-doctor-profile.command.js';

@CommandHandler(CreateDoctorProfileCommand)
export class CreateDoctorProfileHandler implements ICommandHandler<CreateDoctorProfileCommand> {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute({ userId, data }: CreateDoctorProfileCommand): Promise<void> {
    try {
      await this.doctorRepository.create({ data: { ...data, user: userId, verificationStatus: DoctorVerificationStatus.PENDING } });
    } catch (error) {
      await this.userRepository.deleteOne({ filter: { _id: userId } });
      throw error;
    }
  }
}
