import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { SlotView } from '../../type/appointment.type.js';

export class FindSlotQuery extends Query<SlotView | null> {
  constructor(public readonly slotId: Types.ObjectId) {
    super();
  }
}
