import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { SlotView } from '../../entity/index.js';
import { FindSlotQuery } from '../query/index.js';
import { DoctorAvailabilityRepository } from '../../../../database/repository/index.js';

@QueryHandler(FindSlotQuery)
export class FindSlotHandler implements IQueryHandler<FindSlotQuery> {
  constructor(private readonly availabilityRepository: DoctorAvailabilityRepository) {}

  execute({ slotId }: FindSlotQuery): Promise<SlotView | null> {
    return this.availabilityRepository.findById({ _id: slotId, options: { lean: true } });
  }
}
