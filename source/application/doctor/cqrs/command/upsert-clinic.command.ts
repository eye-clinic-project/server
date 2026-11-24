import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { DoctorClinicView } from '../../entity/doctor.type.js';
import type { IDoctor } from '../../../../dependencies/interface/database.interface.js';

export type ClinicData = Partial<Pick<IDoctor, 'clinicName' | 'clinicAddress' | 'specialty' | 'bio' | 'yearsOfExperience'>>;

export class UpsertClinicCommand extends Command<DoctorClinicView> {
  constructor(
    public readonly userId: Types.ObjectId,
    public readonly data: ClinicData,
  ) {
    super();
  }
}
