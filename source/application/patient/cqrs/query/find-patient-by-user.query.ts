import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import { PatientView } from '../../entity/patient.entity.js';

export class FindPatientByUserQuery extends Query<PatientView | null> {
  constructor(public readonly userId: Types.ObjectId) {
    super();
  }
}
