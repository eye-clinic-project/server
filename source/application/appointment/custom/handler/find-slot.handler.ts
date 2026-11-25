import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { SlotView } from '../../type/appointment.type.js';
import { FindSlotQuery } from '../query/find-slot.query.js';
import { DoctorAvailabilityRepository } from '../../../../database/repository/doctor-availability.repository.js';

@QueryHandler(FindSlotQuery)
export class FindSlotHandler implements IQueryHandler<FindSlotQuery> {
  constructor(private readonly availabilityRepository: DoctorAvailabilityRepository) {}

  execute({ slotId }: FindSlotQuery): Promise<SlotView | null> {
    return this.availabilityRepository.findById({ _id: slotId, options: { lean: true } });
  }
}
