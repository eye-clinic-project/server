import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { DoctorRepository, UserRepository } from '../../../../database/repository/index.js';
import { DoctorVerificationStatus } from '../../../../dependencies/enum/index.js';
import { CreateDoctorProfileCommand } from '../command/index.js';

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
