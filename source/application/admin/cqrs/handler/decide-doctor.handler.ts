import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ConflictException, NotFoundException } from '@nestjs/common';
import type { AdminDoctorView } from '../../entity/index.js';
import { DecideDoctorCommand } from '../command/index.js';
import { DoctorRepository, UserRepository } from '../../../../database/repository/index.js';
import { DoctorVerificationStatus } from '../../../../dependencies/enum/index.js';

const USER_FIELDS = 'name email city phone avatarUrl isActive emailVerifiedAt createdAt';

@CommandHandler(DecideDoctorCommand)
export class DecideDoctorHandler implements ICommandHandler<DecideDoctorCommand> {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute({ doctorId, adminId, status, reason }: DecideDoctorCommand): Promise<AdminDoctorView> {
    const current = await this.doctorRepository.findOne({ filter: { _id: doctorId }, projection: { licenseNumber: 1, user: 1 }, options: { lean: true } });
    if (!current) throw new NotFoundException('Doctor not found');
    if (status === DoctorVerificationStatus.APPROVED && !current.licenseNumber) throw new ConflictException('This doctor has not submitted a license number');

    const doctor = await this.doctorRepository.findOneAndUpdate({
      filter: { _id: doctorId },
      update: {
        $set: {
          verificationStatus: status,
          verifiedAt: status === DoctorVerificationStatus.APPROVED ? new Date() : null,
          verifiedBy: adminId,
          rejectionReason: status === DoctorVerificationStatus.REJECTED ? reason : null,
        },
      },
      options: { lean: true, populate: [{ path: 'user', select: USER_FIELDS }] },
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    await this.userRepository.updateOne({ filter: { _id: current.user }, update: { $set: { doctorStatus: status } } });
    return doctor as unknown as AdminDoctorView;
  }
}
