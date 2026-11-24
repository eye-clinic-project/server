import type { Types } from 'mongoose';

import type { IAnalysis, IDoctorReview, IFundusImage, IReport, IUser } from '../../../dependencies/interface/database.interface.js';

export type UserRef = Pick<IUser, 'name' | 'email' | 'avatarUrl'> & { _id: Types.ObjectId };

export type FundusImageView = IFundusImage & { _id: Types.ObjectId };

export type AnalysisView = Omit<IAnalysis, 'patient' | 'image'> & {
  _id: Types.ObjectId;
  patient: UserRef;
  image: FundusImageView | null;
};

export type ReviewView = IDoctorReview & { _id: Types.ObjectId };

export type ReportView = Omit<IReport, 'doctor' | 'patient'> & {
  _id: Types.ObjectId;
  doctor: UserRef;
  patient: UserRef;
};

export interface Page<T> {
  docs: T[];
  count: number;
  currentPage: number;
  size: number;
  pages: number;
}
