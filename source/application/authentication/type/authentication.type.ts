import type { IDoctor, IUser } from '../../../dependencies/interface/database.interface.js';

export type AuthenticationUser = Omit<IUser, 'passwordHash' | 'googleId' | 'language'>;

export type DoctorSignUpData = Pick<IDoctor, 'clinicName' | 'clinicAddress' | 'specialty' | 'licenseNumber'>;
