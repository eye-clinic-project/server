import type { SlotView } from './appointment.type.js';
import { SlotEntity } from './slot.entity.js';

export const toSlotEntity = (slot: SlotView): SlotEntity =>
  new SlotEntity(slot._id, slot.doctor, slot.startAt, slot.endAt, slot.isBooked, slot.appointment ?? null);
