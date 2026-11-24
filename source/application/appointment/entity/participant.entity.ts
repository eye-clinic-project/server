import type { Types } from 'mongoose';
import type { Participant } from './appointment.type.js';

export class ParticipantEntity {
  constructor(
    public readonly _id: Types.ObjectId,
    public readonly name: string,
    public readonly email: string,
    public readonly avatarUrl: string | null = null,
  ) {}
}

export const toParticipantEntity = (user: Participant): ParticipantEntity => new ParticipantEntity(user._id, user.name, user.email, user.avatarUrl ?? null);
