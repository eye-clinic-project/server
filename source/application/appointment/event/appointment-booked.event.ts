import type { AppointmentView } from '../type/appointment.type.js';

export const APPOINTMENT_BOOKED_EVENT = 'appointment.booked';

export class AppointmentBookedEvent {
  constructor(public readonly appointment: AppointmentView) {}
}
