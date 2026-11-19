import type { Types } from 'mongoose';

export class ParticipantEntity {
  constructor(
    public readonly _id: Types.ObjectId,
    public readonly name: string,
    public readonly email: string,
    public readonly avatarUrl: string | null = null,
  ) {}
}
