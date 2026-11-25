import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import { PatientView } from '../../entity/patient.entity.js';

export interface PatientPage {
  docs: PatientView[];
  count: number;
  currentPage: number;
  size: number;
  pages: number;
}

export class ListPatientsQuery extends Query<PatientPage> {
  constructor(
    public readonly page: number,
    public readonly size: number,
    public readonly search?: string,
    public readonly doctorId?: Types.ObjectId,
  ) {
    super();
  }
}
