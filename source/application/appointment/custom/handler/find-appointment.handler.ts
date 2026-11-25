import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { AppointmentView } from '../../type/appointment.type.js';
import { FindAppointmentQuery } from '../query/find-appointment.query.js';
import { AppointmentRepository } from '../../../../database/repository/appointment.repository.js';
import { populateParticipants } from '../../type/appointment.type.js';

@QueryHandler(FindAppointmentQuery)
export class FindAppointmentHandler implements IQueryHandler<FindAppointmentQuery> {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  execute({ appointmentId }: FindAppointmentQuery): Promise<AppointmentView | null> {
    return this.appointmentRepository.findById({ _id: appointmentId, options: { lean: true, populate: populateParticipants } });
  }
}
