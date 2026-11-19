import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

import type { DayRange } from '../../appointment.time.js';

export class CountPatientAppointmentsOnDayQuery extends Query<number> {
  constructor(
    public readonly patientId: Types.ObjectId,
    public readonly day: DayRange,
    public readonly excludeAppointmentId?: Types.ObjectId,
  ) {
    super();
  }
}
