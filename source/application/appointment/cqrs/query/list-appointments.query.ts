import type { Types } from 'mongoose';
import { Query } from '@nestjs/cqrs';

import type { AppointmentStatus } from '../../../../dependencies/enum/index.js';
import type { AppointmentView } from '../../entity/index.js';

export interface AppointmentFilter {
  doctorId?: Types.ObjectId;
  patientId?: Types.ObjectId;
  status?: AppointmentStatus;
  pendingRequest?: boolean;
  from?: Date;
  to?: Date;
}

export class ListAppointmentsQuery extends Query<{ docs: AppointmentView[]; count: number; currentPage: number; size: number; pages: number }> {
  constructor(
    public readonly filter: AppointmentFilter,
    public readonly page: number,
    public readonly size: number,
  ) {
    super();
  }
}
