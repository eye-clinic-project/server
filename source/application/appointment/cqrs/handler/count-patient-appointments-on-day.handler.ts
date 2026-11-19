import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AppointmentRepository } from '../../../../database/repository/index.js';
import { AppointmentRequestStatus, AppointmentStatus } from '../../../../dependencies/enum/index.js';
import { CountPatientAppointmentsOnDayQuery } from '../query/index.js';

const OPEN_STATUSES = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED];

@QueryHandler(CountPatientAppointmentsOnDayQuery)
export class CountPatientAppointmentsOnDayHandler implements IQueryHandler<CountPatientAppointmentsOnDayQuery> {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute({ patientId, day, excludeAppointmentId }: CountPatientAppointmentsOnDayQuery): Promise<number> {
    const inDay = { $gte: day.start, $lt: day.end };
    const appointments = await this.appointmentRepository.find({
      filter: {
        patient: patientId,
        ...(excludeAppointmentId && { _id: { $ne: excludeAppointmentId } }),
        $or: [
          { status: { $in: [...OPEN_STATUSES, AppointmentStatus.COMPLETED] }, scheduledAt: inDay },
          { status: { $in: OPEN_STATUSES }, 'changeRequest.status': AppointmentRequestStatus.PENDING, 'changeRequest.scheduledAt': inDay },
        ],
      },
      projection: { _id: 1 },
      options: { lean: true },
    });
    return appointments.length;
  }
}
