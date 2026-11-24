import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ConflictException, NotFoundException } from '@nestjs/common';
import type { DoctorClinicView } from '../../entity/doctor.type.js';
import { SubmitLicenseCommand } from '../command/submit-license.command.js';
import type { ILicenseDocument } from '../../../../dependencies/interface/database.interface.js';
import { DoctorRepository } from '../../../../database/repository/doctor.repository.js';
import { UserRepository } from '../../../../database/repository/user.repository.js';
import { DoctorVerificationStatus } from '../../../../dependencies/enum/database.enum.js';

@CommandHandler(SubmitLicenseCommand)
export class SubmitLicenseHandler implements ICommandHandler<SubmitLicenseCommand> {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute({ userId, licenseNumber, documents }: SubmitLicenseCommand): Promise<{ doctor: DoctorClinicView; replaced: ILicenseDocument[] }> {
    const current = await this.doctorRepository.findOne({ filter: { user: userId }, options: { lean: true } });
    if (!current) throw new NotFoundException('Doctor profile not found');
    if (current.verificationStatus === DoctorVerificationStatus.APPROVED) throw new ConflictException('Your account is already verified');

    const taken = await this.doctorRepository.findOne({ filter: { licenseNumber, user: { $ne: userId } }, projection: { _id: 1 }, options: { lean: true } });
    if (taken) throw new ConflictException('This license number is already registered');

    const doctor = await this.doctorRepository.findOneAndUpdate({
      filter: { user: userId, verificationStatus: { $ne: DoctorVerificationStatus.APPROVED } },
      update: {
        $set: {
          licenseNumber,
          licenseDocuments: documents,
          verificationStatus: DoctorVerificationStatus.PENDING,
          verificationSubmittedAt: new Date(),
          verifiedAt: null,
          verifiedBy: null,
          rejectionReason: null,
        },
      },
      options: { returnDocument: 'after', lean: true },
    });
    if (!doctor) throw new ConflictException('Your account is already verified');
    await this.userRepository.updateOne({ filter: { _id: userId }, update: { $set: { doctorStatus: DoctorVerificationStatus.PENDING } } });
    return { doctor: doctor as DoctorClinicView, replaced: current.licenseDocuments ?? [] };
  }
}
