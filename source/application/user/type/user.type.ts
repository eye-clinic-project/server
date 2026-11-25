import type { IUser } from '../../../dependencies/interface/database.interface.js';

export type UserProfile = Pick<IUser, 'role' | 'name' | 'email' | 'city' | 'phone' | 'provider' | 'createdAt' | 'updatedAt'>;

export type EditableProfile = Partial<Pick<IUser, 'name' | 'city' | 'language'>>;
