import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { AppointmentView } from '../../entity/appointment.type.js';

export class FindAppointmentQuery extends Query<AppointmentView | null> {
  constructor(public readonly appointmentId: Types.ObjectId) {
    super();
  }
}
