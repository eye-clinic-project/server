import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { AppointmentView } from '../../entity/index.js';
import { FindAppointmentQuery } from '../query/index.js';
import { AppointmentRepository } from '../../../../database/repository/index.js';
import { populateParticipants } from './appointment.helper.js';

@QueryHandler(FindAppointmentQuery)
export class FindAppointmentHandler implements IQueryHandler<FindAppointmentQuery> {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  execute({ appointmentId }: FindAppointmentQuery): Promise<AppointmentView | null> {
    return this.appointmentRepository.findById({ _id: appointmentId, options: { lean: true, populate: populateParticipants } });
  }
}
