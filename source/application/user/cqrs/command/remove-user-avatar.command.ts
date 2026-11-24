import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

import type { HUserDocument } from '../../../../database/model/user.model.js';

export class RemoveUserAvatarCommand extends Command<HUserDocument | null> {
  constructor(public readonly userId: Types.ObjectId) {
    super();
  }
}
