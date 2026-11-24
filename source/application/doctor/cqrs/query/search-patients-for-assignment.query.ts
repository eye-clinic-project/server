import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { PatientSearchView } from '../../entity/doctor.type.js';

export class SearchPatientsForAssignmentQuery extends Query<{ docs: PatientSearchView[]; count: number; currentPage: number; size: number; pages: number }> {
  constructor(
    public readonly doctorId: Types.ObjectId,
    public readonly search: string,
    public readonly page: number,
    public readonly size: number,
  ) {
    super();
  }
}
