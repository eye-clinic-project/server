import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import { ConflictException } from '@nestjs/common';
import { EnsurePatientRecordCommand } from '../command/ensure-patient-record.command.js';
import { PatientRepository } from '../../../../database/repository/patient.repository.js';
import { generateMedicalRecordNumber } from '../../type/patient.type.js';

const MRN_ATTEMPTS = 5;

const isDuplicateKey = (error: unknown, field: string): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000 && field in ((error as { keyPattern?: object }).keyPattern ?? {});

@CommandHandler(EnsurePatientRecordCommand)
export class EnsurePatientRecordHandler implements ICommandHandler<EnsurePatientRecordCommand> {
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute({ userId }: EnsurePatientRecordCommand): Promise<Types.ObjectId> {
    const existing = await this.find(userId);
    if (existing) return existing;

    for (let attempt = 1; ; attempt++) {
      try {
        const created = await this.patientRepository.create({ data: { user: userId, medicalRecordNumber: generateMedicalRecordNumber(), createdBy: userId } });
        return created._id;
      } catch (error) {
        if (isDuplicateKey(error, 'user')) {
          const raced = await this.find(userId);
          if (raced) return raced;
        }
        if (!isDuplicateKey(error, 'medicalRecordNumber')) throw error;
        if (attempt >= MRN_ATTEMPTS) throw new ConflictException('Could not allocate a patient ID, please retry');
      }
    }
  }

  private async find(userId: Types.ObjectId): Promise<Types.ObjectId | null> {
    const found: { _id: Types.ObjectId } | null = await this.patientRepository.findOne({
      filter: { user: userId },
      projection: { _id: 1 },
      options: { lean: true },
    });
    return found?._id ?? null;
  }
}
