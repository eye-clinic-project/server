import type { UserRef, UserRefEntity } from './analysis.type.js';

export const toUserRefEntity = (user: UserRef | null | undefined): UserRefEntity =>
  user ? { _id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl ?? null } : null;
