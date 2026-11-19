import type { Participant } from './appointment.type.js';
import { ParticipantEntity } from './participant.entity.js';

export const toParticipantEntity = (user: Participant): ParticipantEntity => new ParticipantEntity(user._id, user.name, user.email, user.avatarUrl ?? null);
