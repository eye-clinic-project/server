import type { AppointmentView } from '../entity/index.js';

export const APPOINTMENT_REQUEST_DECIDED_EVENT = 'appointment.request-decided';

export class AppointmentRequestDecidedEvent {
  constructor(
    public readonly appointment: AppointmentView,
    public readonly approved: boolean,
    public readonly note?: string,
  ) {}
}
