import { Query } from '@nestjs/cqrs';
import type { AdminDoctorView } from '../../entity/index.js';
import type { DoctorVerificationStatus } from '../../../../dependencies/enum/index.js';

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
