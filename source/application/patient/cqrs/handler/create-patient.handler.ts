import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import { ConflictException } from '@nestjs/common';

import { AssignmentStatus } from '../../../../dependencies/enum/database.enum.js';
import { AuthProviderEnum, SystemRoleEnum } from '../../../../dependencies/enum/security.enum.js';
import { CreatePatientCommand } from '../command/create-patient.command.js';
import { DoctorPatientRepository } from '../../../../database/repository/doctor-patient.repository.js';
import { PatientRepository } from '../../../../database/repository/patient.repository.js';
import { UserRepository } from '../../../../database/repository/user.repository.js';
import { generateMedicalRecordNumber } from './patient.helper.js';

const MRN_ATTEMPTS = 5;

const isDuplicateKey = (error: unknown, field: string): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000 && field in ((error as { keyPattern?: object }).keyPattern ?? {});

@CommandHandler(CreatePatientCommand)
export class CreatePatientHandler implements ICommandHandler<CreatePatientCommand> {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly userRepository: UserRepository,
    private readonly doctorPatientRepository: DoctorPatientRepository,
  ) {}

  async execute({ account, profile, createdBy, assignToDoctor }: CreatePatientCommand): Promise<Types.ObjectId> {
    const user = await this.userRepository
      .create({ data: { ...account, role: SystemRoleEnum.PATIENT, provider: AuthProviderEnum.SYSTEM, emailVerifiedAt: null, isActive: true } })
      .catch((error: unknown) => {
        if (isDuplicateKey(error, 'email'))
          throw new ConflictException('A user with this email already exists. Use "assign patient" to add an existing patient.');
        throw error;
      });

    try {
      const patient = await this.createProfile(user._id, profile, createdBy);
      if (assignToDoctor) {
        await this.doctorPatientRepository.create({
          data: { doctor: assignToDoctor, patient: user._id, status: AssignmentStatus.ACTIVE, assignedAt: new Date(), assignedBy: createdBy },
        });
      }
      return patient._id;
    } catch (error) {
      await this.patientRepository.deleteOne({ filter: { user: user._id } });
      await this.userRepository.deleteOne({ filter: { _id: user._id } });
      throw error;
    }
  }

  private async createProfile(userId: Types.ObjectId, profile: CreatePatientCommand['profile'], createdBy: Types.ObjectId) {
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.patientRepository.create({ data: { ...profile, user: userId, medicalRecordNumber: generateMedicalRecordNumber(), createdBy } });
      } catch (error) {
        if (!isDuplicateKey(error, 'medicalRecordNumber')) throw error;
        if (attempt >= MRN_ATTEMPTS) throw new ConflictException('Could not allocate a patient ID, please retry');
      }
    }
  }
}
