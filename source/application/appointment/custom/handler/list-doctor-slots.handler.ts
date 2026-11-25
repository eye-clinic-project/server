import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { SlotView } from '../../type/appointment.type.js';
import { ListDoctorSlotsQuery } from '../query/list-doctor-slots.query.js';
import { DoctorAvailabilityRepository } from '../../../../database/repository/doctor-availability.repository.js';

@QueryHandler(ListDoctorSlotsQuery)
export class ListDoctorSlotsHandler implements IQueryHandler<ListDoctorSlotsQuery> {
  constructor(private readonly availabilityRepository: DoctorAvailabilityRepository) {}

  execute({ doctorId, from, to, onlyFree }: ListDoctorSlotsQuery): Promise<SlotView[]> {
    return this.availabilityRepository.find({
      filter: { doctor: doctorId, startAt: { $gte: from, $lt: to }, ...(onlyFree && { isBooked: false }) },
      options: { lean: true, sort: { startAt: 1 }, limit: 500 },
    });
  }
}
