import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import { PatientView } from '../../entity/index.js';

export class FindPatientByUserQuery extends Query<PatientView | null> {
  constructor(public readonly userId: Types.ObjectId) {
    super();
  }
}
