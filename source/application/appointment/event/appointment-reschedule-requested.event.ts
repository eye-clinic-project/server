import type { AppointmentView } from '../entity/appointment.type.js';
import type { RescheduleReason } from '../../../dependencies/enum/database.enum.js';

export const APPOINTMENT_RESCHEDULE_REQUESTED_EVENT = 'appointment.reschedule-requested';

export class AppointmentRescheduleRequestedEvent {
  constructor(
    public readonly appointment: AppointmentView,
    public readonly newDate: Date,
    public readonly reason: RescheduleReason,
    public readonly note?: string,
  ) {}
}
