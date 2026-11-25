import type { QueryFilter, Types } from 'mongoose';

import type { IAppointment, IDoctorAvailability, IUser } from '../../../dependencies/interface/database.interface.js';
import { AppointmentEntity } from '../entity/appointment.entity.js';
import { AppointmentRequestStatus, AppointmentStatus } from '../../../dependencies/enum/database.enum.js';

export const PARTICIPANT_FIELDS = 'name email avatarUrl';

export type Participant = Pick<IUser, 'name' | 'email' | 'avatarUrl'> & { _id: Types.ObjectId };

export type SlotView = IDoctorAvailability & { _id: Types.ObjectId };

export type AppointmentView = Omit<IAppointment, 'doctor' | 'patient'> & { _id: Types.ObjectId; doctor: Participant; patient: Participant };

export interface AppointmentPage {
  docs: AppointmentEntity[];
  count: number;
  currentPage: number;
  size: number;
  pages: number;
}

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
