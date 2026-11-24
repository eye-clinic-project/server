import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { AssignedDoctorView } from '../../entity/patient.type.js';

export class ListAssignedDoctorsQuery extends Query<AssignedDoctorView[]> {
  constructor(public readonly patientUserId: Types.ObjectId) {
    super();
  }
}
