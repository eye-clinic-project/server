import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import type { DoctorClinicView } from '../../type/doctor.type.js';
import { UpsertClinicCommand } from '../command/upsert-clinic.command.js';
import { DoctorRepository } from '../../../../database/repository/doctor.repository.js';

@CommandHandler(UpsertClinicCommand)
export class UpsertClinicHandler implements ICommandHandler<UpsertClinicCommand> {
  constructor(private readonly doctorRepository: DoctorRepository) {}

  async execute({ userId, data }: UpsertClinicCommand): Promise<DoctorClinicView> {
    const existing = await this.doctorRepository.findOne({ filter: { user: userId }, projection: { _id: 1 }, options: { lean: true } });

    if (!existing) {
      if (!data.clinicName || !data.clinicAddress) throw new BadRequestException('clinicName and clinicAddress are required to complete your profile');
      const created = await this.doctorRepository.create({ data: { ...data, user: userId, clinicName: data.clinicName, clinicAddress: data.clinicAddress } });
      return created.toObject() as DoctorClinicView;
    }

    if (Object.keys(data).length) await this.doctorRepository.updateOne({ filter: { user: userId }, update: { $set: data } });
    return this.doctorRepository.findOne({ filter: { user: userId }, options: { lean: true } });
  }
}
