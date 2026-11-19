import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

export class IsPatientAssignedQuery extends Query<boolean> {
  constructor(
    public readonly doctorId: Types.ObjectId,
    public readonly patientUserId: Types.ObjectId,
  ) {
    super();
  }
}
