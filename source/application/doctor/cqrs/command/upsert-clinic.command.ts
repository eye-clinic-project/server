import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { DoctorClinicView } from '../../entity/index.js';
import type { IDoctor } from '../../../../dependencies/interface/index.js';

export type ClinicData = Partial<Pick<IDoctor, 'clinicName' | 'clinicAddress' | 'specialty' | 'bio' | 'yearsOfExperience'>>;

export class UpsertClinicCommand extends Command<DoctorClinicView> {
  constructor(
    public readonly userId: Types.ObjectId,
    public readonly data: ClinicData,
  ) {
    super();
  }
}
