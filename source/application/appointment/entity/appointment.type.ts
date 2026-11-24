import type { Types } from 'mongoose';

import type { IAppointment, IDoctorAvailability, IUser } from '../../../dependencies/interface/database.interface.js';
import { AppointmentEntity } from './appointment.entity.js';

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
