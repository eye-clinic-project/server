import { Query } from '@nestjs/cqrs';
import type { AdminDoctorView } from '../../type/admin.type.js';
import type { DoctorVerificationStatus } from '../../../../dependencies/enum/database.enum.js';

export interface DoctorListFilter {
  status?: DoctorVerificationStatus;
  submitted?: boolean;
  search?: string;
  page: number;
  size: number;
}

export class ListDoctorsQuery extends Query<{ docs: AdminDoctorView[]; count: number; currentPage: number; size: number; pages: number }> {
  constructor(public readonly filter: DoctorListFilter) {
    super();
  }
}
