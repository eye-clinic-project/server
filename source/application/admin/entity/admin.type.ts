import type { Types } from 'mongoose';

import type { IDoctor, IUser } from '../../../dependencies/interface/index.js';
import { AdminDoctorEntity } from './admin-doctor.entity.js';

export type AdminDoctorView = IDoctor & {
  _id: Types.ObjectId;
  user: Pick<IUser, 'name' | 'email' | 'city' | 'phone' | 'avatarUrl' | 'isActive' | 'emailVerifiedAt' | 'createdAt'> & { _id: Types.ObjectId };
};

export interface AdminDoctorPage {
  docs: AdminDoctorEntity[];
  count: number;
  currentPage: number;
  size: number;
  pages: number;
}
