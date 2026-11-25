import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { AdminDoctorView } from '../../type/admin.type.js';

export class FindDoctorQuery extends Query<AdminDoctorView | null> {
  constructor(public readonly doctorId: Types.ObjectId) {
    super();
  }
}
