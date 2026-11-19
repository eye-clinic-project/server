import type { AppointmentView } from '../entity/index.js';
import type { RescheduleReason } from '../../../dependencies/enum/index.js';

export const APPOINTMENT_RESCHEDULE_REQUESTED_EVENT = 'appointment.reschedule-requested';

export class AppointmentRescheduleRequestedEvent {
  constructor(
    public readonly appointment: AppointmentView,
    public readonly newDate: Date,
    public readonly reason: RescheduleReason,
    public readonly note?: string,
  ) {}
}
