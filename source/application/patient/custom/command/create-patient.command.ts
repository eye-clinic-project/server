import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

import type { PatientProfileData } from '../../type/patient.type.js';
import { HUserDocument } from '../../../../database/model/user.model.js';

export type PatientAccountData = Pick<HUserDocument, 'name' | 'email' | 'city' | 'phone'>;

export class CreatePatientCommand extends Command<Types.ObjectId> {
  constructor(
    public readonly account: PatientAccountData,
    public readonly profile: PatientProfileData,
    public readonly createdBy: Types.ObjectId,
    public readonly assignToDoctor?: Types.ObjectId,
  ) {
    super();
  }
}
