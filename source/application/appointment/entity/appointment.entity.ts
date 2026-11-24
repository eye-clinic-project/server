import type { Types } from 'mongoose';

import type { AppointmentStatus } from '../../../dependencies/enum/database.enum.js';
import type { IAppointmentChangeRequest, IRescheduleEntry } from '../../../dependencies/interface/database.interface.js';
import { ParticipantEntity, toParticipantEntity } from './participant.entity.js';
import type { AppointmentView } from './appointment.type.js';

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

export const toAppointmentEntity = (appointment: AppointmentView): AppointmentEntity =>
  new AppointmentEntity(
    appointment._id,
    appointment.doctor ? toParticipantEntity(appointment.doctor) : null,
    appointment.patient ? toParticipantEntity(appointment.patient) : null,
    appointment.slot ?? null,
    appointment.scheduledAt,
    appointment.endAt ?? null,
    appointment.status,
    appointment.reason ?? null,
    appointment.cancelledBy ?? null,
    appointment.cancelReason ?? null,
    appointment.changeRequest ?? null,
    appointment.rescheduleHistory ?? [],
    appointment.createdAt,
    appointment.updatedAt,
  );
