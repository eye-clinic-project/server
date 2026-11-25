import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { DoctorClinicView } from '../../type/doctor.type.js';

export class GetDoctorProfileQuery extends Query<DoctorClinicView | null> {
  constructor(public readonly userId: Types.ObjectId) {
    super();
  }
}
