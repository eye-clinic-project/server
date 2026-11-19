import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { QueryFilter } from 'mongoose';

import type { IAppointment } from '../../../../dependencies/interface/index.js';
import { AppointmentRepository } from '../../../../database/repository/index.js';
import { AppointmentRequestStatus } from '../../../../dependencies/enum/index.js';
import { ListAppointmentsQuery } from '../query/index.js';
import { populateParticipants } from './appointment.helper.js';

@QueryHandler(ListAppointmentsQuery)
export class ListAppointmentsHandler implements IQueryHandler<ListAppointmentsQuery> {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  execute({ filter, page, size }: ListAppointmentsQuery) {
    const query: QueryFilter<IAppointment> = {
      ...(filter.doctorId && { doctor: filter.doctorId }),
      ...(filter.patientId && { patient: filter.patientId }),
      ...(filter.status && { status: filter.status }),
      ...(filter.pendingRequest !== undefined && {
        'changeRequest.status': filter.pendingRequest ? AppointmentRequestStatus.PENDING : { $ne: AppointmentRequestStatus.PENDING },
      }),
      ...((filter.from || filter.to) && { scheduledAt: { ...(filter.from && { $gte: filter.from }), ...(filter.to && { $lt: filter.to }) } }),
    };
    return this.appointmentRepository.paginate({
      filter: query,
      options: { lean: true, sort: { scheduledAt: 1 }, populate: populateParticipants },
      page,
      size,
    });
  }
}
