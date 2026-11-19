import type { AppointmentView } from './appointment.type.js';
import { AppointmentEntity } from './appointment.entity.js';
import { toParticipantEntity } from './participant.mapper.js';

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
