import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

import type { IDoctor } from '../../../../dependencies/interface/database.interface.js';

export type DoctorSignUpData = Pick<IDoctor, 'clinicName' | 'clinicAddress' | 'specialty' | 'licenseNumber'>;

export class CreateDoctorProfileCommand extends Command<void> {
  constructor(
    public readonly userId: Types.ObjectId,
    public readonly data: DoctorSignUpData,
  ) {
    super();
  }
}
