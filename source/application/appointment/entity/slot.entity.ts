import type { Types } from 'mongoose';

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
