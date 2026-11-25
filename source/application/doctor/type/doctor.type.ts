import type { Types } from 'mongoose';

import type { IDoctor, IUser } from '../../../dependencies/interface/database.interface.js';
import { PatientSearchEntity } from '../entity/patient-search.entity.js';

export type DoctorClinicView = IDoctor & { _id: Types.ObjectId };

export type PatientSearchView = {
  _id: Types.ObjectId;
  medicalRecordNumber: string;
  user: Pick<IUser, 'name' | 'email' | 'city' | 'avatarUrl'> & { _id: Types.ObjectId };
  assigned: boolean;
};

export interface PatientSearchPage {
  docs: PatientSearchEntity[];
  count: number;
  currentPage: number;
  size: number;
  pages: number;
}
