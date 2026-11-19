import type { AppointmentView } from '../entity/index.js';

export const APPOINTMENT_CANCEL_REQUESTED_EVENT = 'appointment.cancel-requested';

export class AppointmentCancelRequestedEvent {
  constructor(
    public readonly appointment: AppointmentView,
    public readonly reason: string,
  ) {}
}
