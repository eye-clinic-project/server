import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { SlotView } from '../../entity/appointment.type.js';

export class ListDoctorSlotsQuery extends Query<SlotView[]> {
  constructor(
    public readonly doctorId: Types.ObjectId,
    public readonly from: Date,
    public readonly to: Date,
    public readonly onlyFree: boolean,
  ) {
    super();
  }
}
