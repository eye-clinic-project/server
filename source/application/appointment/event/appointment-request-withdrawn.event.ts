import type { AppointmentView } from '../type/appointment.type.js';

export const APPOINTMENT_REQUEST_WITHDRAWN_EVENT = 'appointment.request-withdrawn';

export class AppointmentRequestWithdrawnEvent {
  constructor(public readonly appointment: AppointmentView) {}
}
