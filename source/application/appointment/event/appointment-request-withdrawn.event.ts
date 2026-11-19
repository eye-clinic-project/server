import type { AppointmentView } from '../entity/index.js';

export const APPOINTMENT_REQUEST_WITHDRAWN_EVENT = 'appointment.request-withdrawn';

export class AppointmentRequestWithdrawnEvent {
  constructor(public readonly appointment: AppointmentView) {}
}
