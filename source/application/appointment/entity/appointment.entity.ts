import type { Types } from 'mongoose';

import type { AppointmentStatus } from '../../../dependencies/enum/index.js';
import type { IAppointmentChangeRequest, IRescheduleEntry } from '../../../dependencies/interface/index.js';
import { ParticipantEntity } from './participant.entity.js';

export class AppointmentEntity {
  constructor(
    public readonly _id: Types.ObjectId,
    public readonly doctor: ParticipantEntity | null,
    public readonly patient: ParticipantEntity | null,
    public readonly slot: Types.ObjectId | null,
    public readonly scheduledAt: Date,
    public readonly endAt: Date | null,
    public readonly status: AppointmentStatus,
    public readonly reason: string | null,
    public readonly cancelledBy: Types.ObjectId | null,
    public readonly cancelReason: string | null,
    public readonly changeRequest: IAppointmentChangeRequest | null,
    public readonly rescheduleHistory: IRescheduleEntry[],
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
