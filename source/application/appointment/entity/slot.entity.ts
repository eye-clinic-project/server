import type { Types } from 'mongoose';
import type { SlotView } from '../type/appointment.type.js';

export class SlotEntity {
  constructor(
    public readonly _id: Types.ObjectId,
    public readonly doctor: Types.ObjectId,
    public readonly startAt: Date,
    public readonly endAt: Date,
    public readonly isBooked: boolean,
    public readonly appointment: Types.ObjectId | null = null,
  ) {}
}

export const toSlotEntity = (slot: SlotView): SlotEntity =>
  new SlotEntity(slot._id, slot.doctor, slot.startAt, slot.endAt, slot.isBooked, slot.appointment ?? null);
