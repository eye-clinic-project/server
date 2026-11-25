import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import { PatientView } from '../../entity/patient.entity.js';

export class FindPatientByIdQuery extends Query<PatientView | null> {
  constructor(public readonly patientId: Types.ObjectId) {
    super();
  }
}
