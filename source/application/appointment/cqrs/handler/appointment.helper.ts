import type { QueryFilter, Types } from 'mongoose';

import type { IAppointment } from '../../../../dependencies/interface/database.interface.js';
import { AppointmentRequestStatus, AppointmentStatus } from '../../../../dependencies/enum/database.enum.js';
import { PARTICIPANT_FIELDS } from '../../entity/appointment.type.js';

export const OPEN_STATUSES = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED];

export const populateParticipants = [
  { path: 'doctor', select: PARTICIPANT_FIELDS },
  { path: 'patient', select: PARTICIPANT_FIELDS },
];

export const openWithoutPendingRequest = (appointmentId: Types.ObjectId, patientId: Types.ObjectId): QueryFilter<IAppointment> => ({
  _id: appointmentId,
  patient: patientId,
  status: { $in: OPEN_STATUSES },
  scheduledAt: { $gt: new Date() },
  'changeRequest.status': { $ne: AppointmentRequestStatus.PENDING },
});
