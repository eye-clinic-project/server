import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import { PatientView } from '../../entity/index.js';

export class FindPatientByIdQuery extends Query<PatientView | null> {
  constructor(public readonly patientId: Types.ObjectId) {
    super();
  }
}
