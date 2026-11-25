import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

import type { PatientProfileData } from '../../type/patient.type.js';
import { HUserDocument } from '../../../../database/model/user.model.js';

export type PatientAccountUpdate = Partial<Pick<HUserDocument, 'name' | 'city' | 'phone'>>;

export class UpdatePatientCommand extends Command<void> {
  constructor(
    public readonly patientId: Types.ObjectId,
    public readonly userId: Types.ObjectId,
    public readonly account: PatientAccountUpdate,
    public readonly profile: PatientProfileData,
  ) {
    super();
  }
}
