import type { Types } from 'mongoose';

import type { UserRef } from './analysis.type.js';

export type UserRefEntity = { _id: Types.ObjectId; name: string; email: string; avatarUrl: string | null } | null;

export const toUserRefEntity = (user: UserRef | null | undefined): UserRefEntity =>
  user ? { _id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl ?? null } : null;
