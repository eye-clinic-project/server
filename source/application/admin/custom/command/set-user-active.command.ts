import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

import type { HUserDocument } from '../../../../database/model/user.model.js';

export class SetUserActiveCommand extends Command<HUserDocument | null> {
  constructor(
    public readonly userId: Types.ObjectId,
    public readonly isActive: boolean,
  ) {
    super();
  }
}
