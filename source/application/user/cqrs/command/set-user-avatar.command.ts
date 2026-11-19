import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

import type { HUserDocument } from '../../../../database/model/index.js';

export class SetUserAvatarCommand extends Command<HUserDocument | null> {
  constructor(
    public readonly userId: Types.ObjectId,
    public readonly avatarUrl: string,
  ) {
    super();
  }
}
