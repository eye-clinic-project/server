import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { SlotView } from '../../entity/index.js';
import { ListDoctorSlotsQuery } from '../query/index.js';
import { DoctorAvailabilityRepository } from '../../../../database/repository/index.js';

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
